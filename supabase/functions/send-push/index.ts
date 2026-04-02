import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { restaurant_id, title, body, url, icon } = await req.json()

    if (!restaurant_id) throw new Error('Missing restaurant_id')

    // 1. Get all active subscriptions for this restaurant
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('restaurant_id', restaurant_id)

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sentCount: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Set VAPID keys
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!publicKey || !privateKey) {
      console.error('CRITICAL: VAPID keys are not set in Edge Function secrets.')
      throw new Error('Push service misconfigured on server (Missing VAPID keys)')
    }

    webpush.setVapidDetails(
      'mailto:admin@example.com',
      publicKey,
      privateKey
    )

    // 3. Send notifications in parallel
    const sendPromises = subscriptions.map((sub: any) => {
      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/icons/icon-192x192.png',
        data: { url: url || '/dashboard' }
      })

      return webpush.sendNotification(sub.subscription, payload)
        .catch(err => {
          console.error('Error sending notification to a subscription:', err)
          // Optionally delete the subscription if it's expired/gone
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription has expired or is no longer valid
            // We should ideally unique-identify this subscription to delete it
          }
          return null
        })
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r !== null).length

    return new Response(JSON.stringify({ success: true, sentCount: successCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
