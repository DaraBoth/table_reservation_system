'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ─── Login ────────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})

export type ActionState = { error?: string; success?: string } | null

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    identifier: formData.get('identifier') as string,
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { identifier, password } = parsed.data

  // Convert plain username (no @) to internal email format
  const email = identifier.includes('@') ? identifier : `${identifier}@system.local`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid credentials. Please check your username and password.' }
  }

  // Get role to redirect appropriately
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed.' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (membership?.role === 'superadmin') {
    redirect('/superadmin')
  }
  redirect('/dashboard')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Update Profile ──────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

export async function updateOwnProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = UpdateProfileSchema.safeParse({
    fullName: formData.get('fullName'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.fullName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard')
  return { success: 'Profile updated successfully.' }
}

// ─── Change own password ──────────────────────────────────────────────────────

const ChangePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export async function changeOwnPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = ChangePasswordSchema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })
  if (error) return { error: error.message }

  return { success: 'Password updated successfully.' }
}

// ─── Superadmin resets any user's password ────────────────────────────────────

const ResetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function resetUserPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: memberships } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)

  const membership = memberships?.find(m => ['superadmin', 'admin'].includes(m.role))

  if (!membership) {
    return { error: 'Unauthorized' }
  }

  const parsed = ResetPasswordSchema.safeParse({
    userId: formData.get('userId'),
    newPassword: formData.get('newPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // If admin, verify the target user belongs to their restaurant
  if (membership.role === 'admin') {
    const { data: targetMembership } = await supabase
      .from('account_memberships')
      .select('restaurant_id, role')
      .eq('user_id', parsed.data.userId)
      .single()

    if (
      !targetMembership ||
      targetMembership.restaurant_id !== membership.restaurant_id ||
      targetMembership.role !== 'staff'
    ) {
      return { error: 'You can only reset passwords of staff in your restaurant.' }
    }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.newPassword,
  })

  if (error) return { error: error.message }

  revalidatePath('/superadmin/admins')
  revalidatePath('/dashboard/staff')
  return { success: 'Password reset successfully.' }
}

// ─── TEMPORARY: Superadmin Registration (REMOVE AFTER USE) ───────────────────

export async function tempRegisterSuperadmin(_: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = formData.get('fullName') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!fullName || !username || !password) return { error: 'All fields are required' }

  const email = username.includes('@') ? username : `${username}@system.local`
  const adminClient = createAdminClient()

  // 1. Create the user
  const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (userError) return { error: userError.message }

  // 2. Assign Superadmin role
  const { error: membershipError } = await adminClient
    .from('account_memberships')
    .insert({
      user_id: newUser.user.id,
      role: 'superadmin',
    })

  if (membershipError) {
    // Cleanup if membership fails
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: membershipError.message }
  }

  return { success: `Superadmin account "${username}" created successfully. Please delete this page now.` }
}
