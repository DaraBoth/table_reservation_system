'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionState } from './auth'

// ─── Create Staff (Admin only) ────────────────────────────────────────────────

const CreateStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  username: z.string().min(2, 'Username required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

async function getMembershipForRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  restaurantId: string,
) {
  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .maybeSingle()

  return membership
}

export async function createStaffAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)

  if (membership?.role !== 'admin' || !membership.restaurant_id) {
    return { error: 'Unauthorized — admin only' }
  }

  const parsed = CreateStaffSchema.safeParse({
    fullName: formData.get('fullName'),
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const adminClient = createAdminClient()

  const email = parsed.data.username.includes('@')
    ? parsed.data.username
    : `${parsed.data.username}@system.local`

  const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  })

  if (userError) return { error: userError.message }

  const { error: membershipError } = await supabase
    .from('account_memberships')
    .insert({
      user_id: newUser.user.id,
      restaurant_id: membership.restaurant_id,
      role: 'staff',
    })

  if (membershipError) return { error: membershipError.message }

  revalidatePath(`/dashboard/${restaurantId}/staff`)
  return { success: `Staff account for "${parsed.data.fullName}" created.` }
}

// ─── Toggle member active status ─────────────────────────────────────────────

export async function toggleMemberStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const restaurantId = String(formData.get('restaurantId') || '')

  const membership = restaurantId
    ? await getMembershipForRestaurant(supabase, user.id, restaurantId)
    : (await supabase
        .from('account_memberships')
        .select('role, restaurant_id')
        .eq('user_id', user.id)
        .single()).data

  const memberId = formData.get('memberId') as string
  const isActive = formData.get('isActive') === 'true'

  if (membership?.role === 'superadmin') {
    // Superadmin can toggle any member
    const { error } = await supabase
      .from('account_memberships')
      .update({ is_active: isActive })
      .eq('id', memberId)
    if (error) return { error: error.message }
  } else if (membership?.role === 'admin') {
    if (!restaurantId) return { error: 'Restaurant context missing' }
    // Admin can only toggle staff in their restaurant
    const { error } = await supabase
      .from('account_memberships')
      .update({ is_active: isActive })
      .eq('id', memberId)
      .eq('restaurant_id', restaurantId)
      .eq('role', 'staff')
    if (error) return { error: error.message }
  } else {
    return { error: 'Unauthorized' }
  }

  if (restaurantId) revalidatePath(`/dashboard/${restaurantId}/staff`)
  revalidatePath('/superadmin/admins')
  return { success: `Account ${isActive ? 'enabled' : 'disabled'}.` }
}

// ─── Superadmin: Create User with any Role ────────────────────────────────────

const SuperadminCreateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  username: z.string().min(2, 'Username required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['superadmin', 'admin', 'staff']),
  restaurantId: z.string().uuid().optional().or(z.literal('')),
})

export async function superadminCreateUser(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'superadmin') return { error: 'Unauthorized — superadmin only' }

  const parsed = SuperadminCreateUserSchema.safeParse({
    fullName: formData.get('fullName'),
    username: formData.get('username'),
    password: formData.get('password'),
    role: formData.get('role'),
    restaurantId: formData.get('restaurantId'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const email = parsed.data.username.includes('@')
    ? parsed.data.username
    : `${parsed.data.username}@system.local`

  const adminClient = createAdminClient()
  const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  })

  if (userError) return { error: userError.message }

  const { error: membershipError } = await supabase
    .from('account_memberships')
    .insert({
      user_id: newUser.user.id,
      restaurant_id: parsed.data.restaurantId || null,
      role: parsed.data.role,
    })

  if (membershipError) return { error: membershipError.message }

  revalidatePath('/superadmin/users')
  return { success: `Account for "${parsed.data.fullName}" created as ${parsed.data.role}.` }
}

// ─── Superadmin: Delete User Account ──────────────────────────────────────────

export async function deleteUserAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'superadmin') return { error: 'Unauthorized' }

  const targetUserId = formData.get('userId') as string
  if (targetUserId === user.id) return { error: 'Cannot delete your own account' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(targetUserId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/users')
  return { success: 'Account deleted successfully.' }
}

// ─── Admin: Delete Staff Member (Hard Delete) ──────────────────────────────────

export async function deleteStaffMember(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)

  if (membership?.role !== 'admin' || !membership.restaurant_id) {
    return { error: 'Unauthorized — admin only' }
  }

  const targetUserId = formData.get('userId') as string
  if (targetUserId === user.id) return { error: 'Cannot delete your own account' }

  // Verify the target is actually staff in THIS restaurant
  const { data: targetMembership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', targetUserId)
    .eq('restaurant_id', restaurantId)
    .eq('role', 'staff')
    .single()

  if (!targetMembership) return { error: 'Staff member not found in your restaurant' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(targetUserId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/${restaurantId}/staff`)
  return { success: 'Staff member account fully removed from database.' }
}

// ─── Superadmin: Update Special Admin & Features ──────────────────────────────

export async function updateSpecialAdminStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'superadmin') return { error: 'Unauthorized — superadmin only' }

  const membershipId = formData.get('membershipId') as string
  const isSpecial = formData.get('isSpecial') === 'true'
  const featuresRaw = formData.get('features') as string
  let features = {}

  try {
    features = JSON.parse(featuresRaw || '{}')
  } catch (e) {
    return { error: 'Malformed feature configuration payload.' }
  }

  // Manual UUID & Basic Validation to bypass Zod v4 runtime conflicts
  if (!membershipId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(membershipId)) {
    return { error: 'Invalid membership identity format.' }
  }

  const { error } = await supabase
    .from('account_memberships')
    .update({ 
      is_special_admin: isSpecial,
      special_features: features
    } as any)
    .eq('id', membershipId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/admins')
  return { success: 'Special Admin status and features updated.' }
}
