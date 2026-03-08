import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumGateProps {
  feature: string;
  description: string;
  children: React.ReactNode;
  requiredTier?: 'basic' | 'premium' | 'elite';
}

const PremiumGate = ({ 
  feature, 
  description, 
  children, 
  requiredTier = 'basic' 
}: PremiumGateProps) => {
  const { subscription, createCheckoutSession } = useSubscription();

  const tierHierarchy = {
    free: 0,
    basic: 1,
    premium: 2,
    elite: 3
  };

  const hasAccess = tierHierarchy[subscription.tier] >= tierHierarchy[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    const priceIds = {
      basic: 'price_basic_monthly',
      premium: 'price_premium_monthly',
      elite: 'price_elite_monthly'
    };
    createCheckoutSession(priceIds[requiredTier]);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-accent to-background">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Crown className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" />
          Premium Feature
        </CardTitle>
        <CardDescription className="text-center">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-2">{feature}</h3>
          <p className="text-sm text-muted-foreground">
            Upgrade to {requiredTier} to unlock this feature
          </p>
        </div>
        <Button 
          onClick={handleUpgrade}
          className="w-full"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PremiumGate;
