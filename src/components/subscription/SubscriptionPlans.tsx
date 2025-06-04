
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
  priceId: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    description: 'Perfect for getting started',
    icon: <Star className="h-6 w-6" />,
    priceId: '',
    features: [
      { text: '50 swipes per day', included: true },
      { text: 'Basic matching', included: true },
      { text: 'Send messages to matches', included: true },
      { text: 'See who liked you', included: false },
      { text: 'Unlimited likes', included: false },
      { text: 'Super likes', included: false },
      { text: 'Boost profile', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    description: 'More matches, more connections',
    icon: <Zap className="h-6 w-6" />,
    priceId: 'price_basic_monthly',
    features: [
      { text: 'Unlimited swipes', included: true },
      { text: 'See who liked you', included: true },
      { text: '5 super likes per day', included: true },
      { text: 'Basic matching', included: true },
      { text: 'Send messages to matches', included: true },
      { text: 'Boost profile', included: false },
      { text: 'Advanced filters', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    interval: 'month',
    description: 'Maximum dating potential',
    icon: <Crown className="h-6 w-6" />,
    priceId: 'price_premium_monthly',
    popular: true,
    features: [
      { text: 'Everything in Basic', included: true },
      { text: 'Unlimited super likes', included: true },
      { text: '5 boosts per month', included: true },
      { text: 'Advanced filters', included: true },
      { text: 'Read receipts', included: true },
      { text: 'Priority support', included: true },
      { text: 'Travel mode', included: true },
    ],
  },
];

const SubscriptionPlans = () => {
  const { subscription, createCheckoutSession } = useSubscription();

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === 'free') return;
    createCheckoutSession(plan.priceId);
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 mt-2">Upgrade to unlock premium features and find more matches</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-pink-500 shadow-lg scale-105' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-pink-500">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2 text-pink-500">
                {plan.icon}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-500">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check 
                      className={`h-4 w-4 ${feature.included ? 'text-green-500' : 'text-gray-300'}`} 
                    />
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={subscription.tier === plan.id}
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
              >
                {subscription.tier === plan.id ? 'Current Plan' : `Get ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
