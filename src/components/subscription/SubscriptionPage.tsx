
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Settings, Check } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTierFeatures } from '@/hooks/useTierFeatures';
import SubscriptionPlans from './SubscriptionPlans';
import LikesGrid from '../discover/LikesGrid';
import BoostProfile from '../premium/BoostProfile';
import ProfileViews from '../social/ProfileViews';

const SubscriptionPage = () => {
  const { subscription, createPortalSession } = useSubscription();
  const features = useTierFeatures();

  const isPremium = features.isPaid;

  const perks = [
    { label: 'Unlimited swipes', enabled: features.dailySwipes === -1 },
    { label: 'See who liked you', enabled: features.canSeeWhoLikedYou },
    { label: 'Super likes', enabled: features.dailySuperLikes !== 0 },
    { label: 'Advanced filters', enabled: features.canUseAdvancedFilters },
    { label: 'Profile boost', enabled: features.canUseBoost },
    { label: 'Read receipts', enabled: features.canSeeReadReceipts },
    { label: 'Travel mode', enabled: features.hasTravelMode },
    { label: 'Incognito mode', enabled: features.hasIncognitoMode },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Current Subscription Status */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-primary" />
                <CardTitle>Your Subscription</CardTitle>
              </div>
              <Badge variant={isPremium ? 'default' : 'secondary'}>
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold capitalize text-foreground">{subscription.tier}</p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Daily Swipes</p>
                <p className="text-lg font-semibold text-foreground">
                  {features.dailySwipes === -1 ? 'Unlimited' : subscription.remainingSwipes}
                </p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize text-foreground">{subscription.status}</p>
              </div>
            </div>

            {/* Per-tier perks summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {perks.map((perk) => (
                <div
                  key={perk.label}
                  className={`flex items-center gap-2 text-xs p-2 rounded-md border ${
                    perk.enabled
                      ? 'border-primary/30 bg-primary/5 text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground/60'
                  }`}
                >
                  <Check className={`h-3 w-3 ${perk.enabled ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>{perk.label}</span>
                </div>
              ))}
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

        {/* Subscription Plans — always show so users can upgrade between tiers */}
        <SubscriptionPlans />
      </div>
    </div>
  );
};

export default SubscriptionPage;
