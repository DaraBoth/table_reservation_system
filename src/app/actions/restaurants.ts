'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  adminFullName: z.string().optional().or(z.literal('')),
  adminUsername: z.string().optional().or(z.literal('')),
  adminPassword: z.string().optional().or(z.literal('')),
})

export async function createRestaurant(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membershipsRaw } = await supabase
    .from('account_memberships')
    .select('role, is_special_admin, special_features, restaurant_id')
    .eq('user_id', user.id)

  const memberships = (membershipsRaw as any[]) || []
  const primaryMembership = memberships.find(m => m.is_special_admin) || memberships[0]
  const isSuperadmin = primaryMembership?.role === 'superadmin'
  
  // Parse JSON features safely
  const specialFeatures = (primaryMembership?.special_features as Record<string, any>) || {}
  const hasCreationRight = !!specialFeatures['create_restaurant']
  const isSpecialAdmin = primaryMembership?.is_special_admin === true && hasCreationRight
  const maxBrands = specialFeatures['create_restaurant']?.max_brands || 1

  if (!isSuperadmin && !isSpecialAdmin) {
    return { error: 'Unauthorized — elevation required for multi-brand expansion.' }
  }

  // Quota Enforcement for Special Admins
  if (isSpecialAdmin && !isSuperadmin) {
    const activeBrandsCount = memberships?.length || 0
    if (activeBrandsCount >= maxBrands) {
      return { error: `Expansion limit reached. You currently have ${activeBrandsCount}/${maxBrands} brands in your portfolio.` }
    }
  }

  const parsed = CreateRestaurantSchema.safeParse({
    name: formData.get('name') || undefined,
    slug: formData.get('slug') || undefined,
    contactEmail: formData.get('contactEmail') || undefined,
    contactPhone: formData.get('contactPhone') || undefined,
    address: formData.get('address') || undefined,
    subscriptionExpiresAt: formData.get('subscriptionExpiresAt') || undefined,
    businessType: formData.get('businessType') || 'restaurant',
    adminFullName: formData.get('adminFullName') || undefined,
    adminUsername: formData.get('adminUsername') || undefined,
    adminPassword: formData.get('adminPassword') || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const adminClient = createAdminClient()

  // 1. Create the restaurant using adminClient to bypass RLS
  const { data: restaurant, error: restaurantError } = await adminClient
    .from('restaurants')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      contact_email: parsed.data.contactEmail || null,
      contact_phone: parsed.data.contactPhone || null,
      address: parsed.data.address || null,
      subscription_expires_at: parsed.data.subscriptionExpiresAt || null,
      business_type: parsed.data.businessType,
      is_new: !isSpecialAdmin, 
    })
    .select()
    .single()

  if (restaurantError) {
    // Handle unique constraint violation on slug
    if (restaurantError.code === '23505' || restaurantError.message.includes('restaurants_slug_key')) {
      return { error: 'Brand identifier (slug) is already taken. Please choose another.' }
    }
    return { error: restaurantError.message }
  }

  if (isSuperadmin) {
    // 2. Create the admin user via admin API (no email verification)
    const adminEmail = parsed.data.adminUsername?.includes('@')
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
      return { error: `Failed to build admin identity: ${userError.message}` }
    }

    // 3. Assign admin role to the new user for this restaurant
    const { error: membershipError } = await adminClient
      .from('account_memberships')
      .insert({
        user_id: newUser.user.id,
        restaurant_id: restaurant.id,
        role: 'admin',
      })
    if (membershipError) return { error: membershipError.message }
  } else {
    // 2. Special Admin Scenario: The current user becomes the admin of the new restaurant
    const { error: membershipError } = await adminClient
      .from('account_memberships')
      .insert({
        user_id: user.id,
        restaurant_id: restaurant.id,
        role: 'admin',
        is_special_admin: true, 
        special_features: specialFeatures
      } as any)
    if (membershipError) return { error: membershipError.message }
  }

  revalidatePath('/superadmin/restaurants')
  revalidatePath('/superadmin')
  
  // Transition back to the newly established brand dashboard
  redirect(`/dashboard/${restaurant.id}`)
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
      business_type: formData.get('businessType') as any || 'restaurant',
    })
    .eq('id', restaurantId)

  if (error) return { error: error.message }

  revalidatePath('/superadmin/restaurants')
  revalidatePath(`/superadmin/restaurants/${restaurantId}`)
  return { success: 'Restaurant updated.' }
}

// ─── Update Own Restaurant Info (Admin) ──────────────────────────────────────

export async function updateOwnRestaurantInfo(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = formData.get('restaurantId') as string
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .single()

  if (!['admin', 'superadmin'].includes(membership?.role || '') || !membership?.restaurant_id) {
    return { error: 'Unauthorized — business owner only' }
  }

  const { error } = await supabase
    .from('restaurants')
    .update({
      name: formData.get('name') as string,
      contact_email: formData.get('contactEmail') as string || null,
      contact_phone: formData.get('contactPhone') as string || null,
      address: formData.get('address') as string || null,
      logo_url: formData.get('logoUrl') as string || null,
    })
    .eq('id', restaurantId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/${restaurantId}`)
  revalidatePath(`/dashboard/${restaurantId}/account`)
  return { success: 'Business info updated.' }
}

// ─── Update Restaurant Logo (Admin) ──────────────────────────────────────────

export async function updateRestaurantLogo(restaurantId: string, formData: FormData): Promise<ActionState> {
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .single()

  if (!['admin', 'superadmin'].includes(membership?.role || '') || !membership?.restaurant_id) {
    return { error: 'Unauthorized — business owner only' }
  }

  const file = formData.get('file') as Blob
  if (!file) return { error: 'No logo file provided' }

  const fileName = `${restaurantId}/${Date.now()}.jpg`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('logos')
    .upload(fileName, file, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (uploadError) return { error: `Logo upload failed: ${uploadError.message}` }

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName)

  // Update restaurant info
  const { error: updateError } = await supabase
    .from('restaurants')
    .update({ logo_url: publicUrl })
    .eq('id', restaurantId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/${restaurantId}`)
  revalidatePath(`/dashboard/${restaurantId}/account`)
  revalidatePath(`/`) 

  return { success: 'Logo updated successfully' }
}

// ─── Finish Restaurant Setup ──────────────────────────────────────────────────

export async function completeRestaurantSetup(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = formData.get('restaurantId') as string
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .single()

  if (!['admin', 'superadmin'].includes(membership?.role || '') || !membership?.restaurant_id) {
    return { error: 'Unauthorized' }
  }

  // Use service-role client to bypass RLS — the role check above already authorises this.
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('restaurants')
    .update({
      is_new: false,
      name: formData.get('name') as string,
      business_type: formData.get('businessType') as any || 'restaurant',
      contact_email: (formData.get('contactEmail') as string) || null,
      contact_phone: (formData.get('contactPhone') as string) || null,
      address: (formData.get('address') as string) || null,
      logo_url: (formData.get('logoUrl') as string) || null,
    })
    .eq('id', restaurantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
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

  revalidatePath('/superadmin/restaurants')
  revalidatePath('/superadmin')
  return { success: 'Subscription updated successfully.' }
}

// ─── Get Expansion Status (Special Admin) ───────────────────────────────────

export async function getExpansionStatus(): Promise<{ count: number; max: number; isSpecial: boolean; isSuper: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { count: 0, max: 0, isSpecial: false, isSuper: false }

  const { data: membershipsRaw } = await supabase
    .from('account_memberships')
    .select('role, is_special_admin, special_features, restaurant_id')
    .eq('user_id', user.id)

  const memberships = (membershipsRaw as any[]) || []
  const primaryMembership = memberships.find(m => m.is_special_admin) || memberships[0]
  const isSuper = primaryMembership?.role === 'superadmin'
  
  const specialFeatures = (primaryMembership?.special_features as Record<string, any>) || {}
  const hasCreationRight = !!specialFeatures['create_restaurant']
  const isSpecial = primaryMembership?.is_special_admin === true && hasCreationRight
  const max = specialFeatures['create_restaurant']?.max_brands || 1

  return {
    count: memberships.length,
    max: isSuper ? Infinity : max,
    isSpecial,
    isSuper
  }
}
