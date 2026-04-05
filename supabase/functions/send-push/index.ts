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

    const { restaurant_id, title, body, url, icon, debug_id } = await req.json()
    const debugId = debug_id || crypto.randomUUID()

    if (!restaurant_id) throw new Error('Missing restaurant_id')

    console.log(`[push:${debugId}] Incoming request`, {
      restaurant_id,
      title,
      body,
      url,
    })

    // 1. Get all active subscriptions for this restaurant
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('restaurant_id', restaurant_id)

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[push:${debugId}] No subscriptions found for restaurant ${restaurant_id}`)
      return new Response(JSON.stringify({
        success: true,
        requestId: debugId,
        attemptedCount: 0,
        sentCount: 0,
        failedCount: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[push:${debugId}] Found ${subscriptions.length} subscriptions`)

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
    const sendPromises = subscriptions.map((sub: any, index: number) => {
      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/icons/maskable_icon_x192.png',
        data: { url: url || '/dashboard' }
      })

      return webpush.sendNotification(sub.subscription, payload)
        .then(() => ({ ok: true }))
        .catch(err => {
          console.error(`[push:${debugId}] Error sending notification to subscription ${index}:`, err)
          // Optionally delete the subscription if it's expired/gone
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription has expired or is no longer valid
            // We should ideally unique-identify this subscription to delete it
          }
          return { ok: false, statusCode: err.statusCode, message: err.message }
        })
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter((result) => result?.ok).length
    const failedCount = results.length - successCount

    console.log(`[push:${debugId}] Completed`, {
      attemptedCount: results.length,
      sentCount: successCount,
      failedCount,
    })

    return new Response(JSON.stringify({
      success: true,
      requestId: debugId,
      attemptedCount: results.length,
      sentCount: successCount,
      failedCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown push error'
    console.error('[push] Fatal error:', error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
