'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionState } from './auth'

// ─── Create restaurant (Superadmin) ──────────────────────────────────────────

const CreateRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  subscriptionExpiresAt: z.string().optional(),
  businessType: z.enum(['restaurant', 'hotel', 'guesthouse']).default('restaurant'),
  // Admin to create alongside the restaurant
  adminFullName: z.string().min(2, 'Admin name required'),
  adminUsername: z.string().min(2, 'Admin username required'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function createRestaurant(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'superadmin') return { error: 'Unauthorized — superadmin only' }

  const parsed = CreateRestaurantSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone'),
    address: formData.get('address'),
    subscriptionExpiresAt: formData.get('subscriptionExpiresAt'),
    businessType: formData.get('businessType') || 'restaurant',
    adminFullName: formData.get('adminFullName'),
    adminUsername: formData.get('adminUsername'),
    adminPassword: formData.get('adminPassword'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const adminClient = createAdminClient()

  // 1. Create the restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      contact_email: parsed.data.contactEmail || null,
      contact_phone: parsed.data.contactPhone || null,
      address: parsed.data.address || null,
      subscription_expires_at: parsed.data.subscriptionExpiresAt || null,
      business_type: parsed.data.businessType,
    })
    .select()
    .single()

  if (restaurantError) return { error: restaurantError.message }

  // 2. Create the admin user via admin API (no email verification)
  const adminEmail = parsed.data.adminUsername.includes('@')
    ? parsed.data.adminUsername
    : `${parsed.data.adminUsername}@system.local`

  const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: parsed.data.adminPassword,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.adminFullName },
  })

  if (userError) {
    // Rollback restaurant
    await supabase.from('restaurants').delete().eq('id', restaurant.id)
    return { error: `Failed to create admin user: ${userError.message}` }
  }

  // 3. Assign admin role to the new user for this restaurant
  const { error: membershipError } = await supabase
    .from('account_memberships')
    .insert({
      user_id: newUser.user.id,
      restaurant_id: restaurant.id,
      role: 'admin',
    })

  if (membershipError) return { error: membershipError.message }

  revalidatePath('/superadmin/restaurants')
  revalidatePath('/superadmin')
  return { success: `Restaurant "${parsed.data.name}" created with admin account.` }
}

// ─── Update restaurant ────────────────────────────────────────────────────────

export async function updateRestaurant(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'superadmin') return { error: 'Unauthorized' }

  const restaurantId = formData.get('restaurantId') as string

  const { error } = await supabase
    .from('restaurants')
    .update({
      name: formData.get('name') as string,
      contact_email: formData.get('contactEmail') as string || null,
      contact_phone: formData.get('contactPhone') as string || null,
      address: formData.get('address') as string || null,
    })
    .eq('id', restaurantId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/restaurants')
  revalidatePath(`/superadmin/restaurants/${restaurantId}`)
  return { success: 'Restaurant updated.' }
}

// ─── Update subscription ──────────────────────────────────────────────────────

export async function updateSubscription(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'superadmin') return { error: 'Unauthorized' }

  const restaurantId = formData.get('restaurantId') as string
  const expiresAt = formData.get('subscriptionExpiresAt') as string
  const isActive = formData.get('isActive') === 'true'

  const { error } = await supabase
    .from('restaurants')
    .update({
      subscription_expires_at: expiresAt || null,
      is_active: isActive,
    })
    .eq('id', restaurantId)

  if (error) return { error: error.message }

  revalidatePath(`/superadmin/restaurants/${restaurantId}`)
  revalidatePath('/superadmin/restaurants')
  return { success: 'Subscription updated successfully.' }
}
