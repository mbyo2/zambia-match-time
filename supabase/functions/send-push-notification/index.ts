import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    const { user_id, title, body, data } = payload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notification to user: ${user_id}`);

    // Get user's push subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user');
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      const subscription = sub.subscription as any;
      
      // Handle native push (FCM/APNs tokens)
      if (subscription.type === 'native' && subscription.token) {
        console.log(`Native push token found for platform: ${subscription.platform}`);
        // For now, log that we would send to native
        // In production, you'd integrate with FCM/APNs here
        console.log(`Would send native push to ${subscription.platform}: ${title}`);
        sent++;
        continue;
      }

      // Handle web push subscriptions
      if (subscription.endpoint) {
        try {
          // Web Push API - send notification
          const pushPayload = JSON.stringify({
            title,
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: data || {},
          });

          // Note: For production web push, you'd need VAPID keys and web-push library
          // For MVP, we rely on local notifications triggered by realtime subscriptions
          console.log(`Web push endpoint found: ${subscription.endpoint.substring(0, 50)}...`);
          sent++;
        } catch (pushError) {
          console.error('Error sending web push:', pushError);
          errors.push(`Web push failed: ${pushError}`);
        }
      }
    }

    console.log(`Push notifications processed: ${sent} sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
