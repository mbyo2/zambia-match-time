
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new (await import('https://esm.sh/stripe@13.11.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY') ?? '',
  {
    apiVersion: '2023-10-16',
  }
)

const cryptoProvider = Deno.createHttpClient({
  http2: false,
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const relevantEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
])

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  let receivedEvent
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message)
    return new Response(`Webhook signature verification failed.`, { status: 400 })
  }

  console.log(`Processing event: ${receivedEvent.type}`)

  if (relevantEvents.has(receivedEvent.type)) {
    try {
      switch (receivedEvent.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(receivedEvent.data.object)
          break
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(receivedEvent.data.object)
          break
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(receivedEvent.data.object)
          break
        case 'invoice.payment_failed':
          await handlePaymentFailed(receivedEvent.data.object)
          break
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      return new Response('Webhook processing failed', { status: 500 })
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})

async function handleSubscriptionUpdate(subscription: any) {
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = customer.metadata?.user_id

  if (!userId) {
    console.error('No user ID found in customer metadata')
    return
  }

  // Map Stripe price to subscription tier
  let tier = 'free'
  if (subscription.items?.data[0]?.price?.id) {
    const priceId = subscription.items.data[0].price.id
    // You'll need to map your actual Stripe price IDs here
    if (priceId === 'price_basic_monthly' || priceId === 'price_basic_yearly') {
      tier = 'basic'
    } else if (priceId === 'price_premium_monthly' || priceId === 'price_premium_yearly') {
      tier = 'premium'
    } else if (priceId === 'price_elite_monthly' || priceId === 'price_elite_yearly') {
      tier = 'elite'
    }
  }

  await supabaseClient
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })

  // Create notification for subscription update
  await supabaseClient.rpc('create_notification', {
    target_user_id: userId,
    notification_type: 'subscription',
    notification_title: 'Subscription Updated',
    notification_message: `Your subscription has been updated to ${tier}`,
  })
}

async function handleSubscriptionDeleted(subscription: any) {
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = customer.metadata?.user_id

  if (!userId) {
    console.error('No user ID found in customer metadata')
    return
  }

  await supabaseClient
    .from('user_subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  // Create notification for subscription cancellation
  await supabaseClient.rpc('create_notification', {
    target_user_id: userId,
    notification_type: 'subscription',
    notification_title: 'Subscription Canceled',
    notification_message: 'Your subscription has been canceled',
  })
}

async function handlePaymentSucceeded(invoice: any) {
  const customer = await stripe.customers.retrieve(invoice.customer)
  const userId = customer.metadata?.user_id

  if (!userId) {
    console.error('No user ID found in customer metadata')
    return
  }

  // Create notification for successful payment
  await supabaseClient.rpc('create_notification', {
    target_user_id: userId,
    notification_type: 'subscription',
    notification_title: 'Payment Successful',
    notification_message: `Payment of $${(invoice.amount_paid / 100).toFixed(2)} processed successfully`,
  })
}

async function handlePaymentFailed(invoice: any) {
  const customer = await stripe.customers.retrieve(invoice.customer)
  const userId = customer.metadata?.user_id

  if (!userId) {
    console.error('No user ID found in customer metadata')
    return
  }

  // Create notification for failed payment
  await supabaseClient.rpc('create_notification', {
    target_user_id: userId,
    notification_type: 'subscription',
    notification_title: 'Payment Failed',
    notification_message: 'Your payment could not be processed. Please update your payment method.',
  })
}
