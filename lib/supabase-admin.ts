import { createClient } from '@supabase/supabase-js'
 
// SERVER-ONLY. Never import this file from a client component or anything
// that runs in the browser - the service role key bypasses RLS entirely.
// It is used here only so the IntouchPay callback (which is not logged in
// as the admin user) can update the orders table after a payment resolves.
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
 
if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY - admin Supabase client cannot be created.'
  )
}
 
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})