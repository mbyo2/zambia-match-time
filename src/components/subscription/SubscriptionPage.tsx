
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Settings } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionPlans from './SubscriptionPlans';
import LikesGrid from '../discover/LikesGrid';
import BoostProfile from '../premium/BoostProfile';
import ProfileViews from '../social/ProfileViews';

const SubscriptionPage = () => {
  const { subscription, createPortalSession } = useSubscription();

  const isPremium = subscription.tier !== 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Current Subscription Status */}
        <Card className="border-pink-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-pink-500" />
                <CardTitle>Your Subscription</CardTitle>
              </div>
              <Badge variant={isPremium ? 'default' : 'secondary'}>
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-semibold capitalize">{subscription.tier}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Daily Swipes</p>
                <p className="text-lg font-semibold">
                  {subscription.tier === 'free' ? subscription.remainingSwipes : 'Unlimited'}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold capitalize">{subscription.status}</p>
              </div>
            </div>
            
            {isPremium && (
              <div className="flex justify-center">
                <Button onClick={createPortalSession} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BoostProfile />
          <ProfileViews />
        </div>

        {/* Likes Grid */}
        <LikesGrid />

        {/* Subscription Plans */}
        {!isPremium && <SubscriptionPlans />}
      </div>
    </div>
  );
};

export default SubscriptionPage;
