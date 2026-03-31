import { createClient } from '@/lib/supabase/server'

export default async function TestQuery() {
  const supabase = await createClient()
  
  console.log('--- DB DIAGNOSTIC ---')
  
  const { data: authUser } = await supabase.auth.getUser()
  console.log('Authenticated User:', authUser.user?.id || 'NULL')
  
  const { data: memberships, error: memError } = await supabase
    .from('account_memberships')
    .select('*, profiles(*), restaurants(*)')
    
  if (memError) {
    console.error('Memberships Error:', memError)
  } else {
    console.log('Memberships Count:', memberships?.length || 0)
    console.log('Raw Memberships:', JSON.stringify(memberships, null, 2))
  }
  
  return null
}
