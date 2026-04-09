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

export type ActionState = { 
  error?: string; 
  success?: string; 
  url?: string;
  profile?: { fullName: string; avatarUrl: string | null }
} | null

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

  // Get role and profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed.' }

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
  ])

  const targetUrl = membership?.role === 'superadmin' ? '/superadmin' : '/dashboard'

  return {
    success: 'true',
    url: targetUrl,
    profile: {
      fullName: profile?.full_name || email.split('@')[0],
      avatarUrl: profile?.avatar_url || null
    }
  }
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
  username: z.string().min(2, 'Username must be at least 2 characters').regex(/^[a-z0-9_.]+$/, 'Username can only contain lowercase letters, numbers, underscores, and periods'),
})

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()
    const email = username.includes('@') ? username : `${username}@system.local`
    
    // We list users and check manually as Supabase doesn't offer a direct "exists" for auth.users without RPC
    // For small to medium apps this is fine. For larger ones, an RPC or profiles column is better.
    const { data: { users }, error } = await adminClient.auth.admin.listUsers()
    if (error) throw error
    
    const exists = users.some(u => u.email?.toLowerCase() === email.toLowerCase())
    return { available: !exists }
  } catch (error: any) {
    return { available: false, error: error.message }
  }
}

export async function updateOwnProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = UpdateProfileSchema.safeParse({
    fullName: formData.get('fullName'),
    username: formData.get('username'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const oldEmail = user.email || ''
  const isSystemEmail = oldEmail.endsWith('@system.local')
  const newUsername = parsed.data.username
  const newEmail = isSystemEmail ? `${newUsername}@system.local` : newUsername

  // If username/email changed, check availability
  if (newEmail.toLowerCase() !== oldEmail.toLowerCase()) {
    const { available, error: checkError } = await checkUsernameAvailability(newUsername)
    if (checkError) return { error: checkError }
    if (!available) return { error: 'This username is already taken.' }

    // Update Auth Email
    const adminClient = createAdminClient()
    const { error: authError } = await adminClient.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true // Force confirmation since it's a system change
    })
    if (authError) return { error: authError.message }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.fullName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard')
  return { success: 'Profile updated successfully.' }
}

// ─── Update Profile Avatar ──────────────────────────────────────────────────

export async function updateProfileAvatar(formData: FormData): Promise<{ error?: string; url?: string }> {
  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Use a fixed name to overwrite previous avatar
  const filePath = `${user.id}/avatar.jpg`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { 
        upsert: true,
        contentType: 'image/jpeg'
    })

  if (uploadError) return { error: uploadError.message }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard')
  return { url: publicUrl }
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
