
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Crown } from 'lucide-react';
import { useTierFeatures } from '@/hooks/useTierFeatures';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BoostProfile = () => {
  const { canUseBoost, monthlyBoosts, tier } = useTierFeatures();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastBoost, setLastBoost] = useState<Date | null>(null);

  const canBoost = canUseBoost;
  const boostDuration = 30; // minutes

  const handleBoost = async () => {
    if (!canBoost) {
      toast({
        title: "Premium Plan Required",
        description: "Profile boost is available for Premium or Elite members.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('daily_limits')
        .upsert({
          user_id: user?.id,
          date: new Date().toISOString().split('T')[0],
          boosts_used: 1
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      setLastBoost(new Date());
      toast({
        title: "Profile Boosted!",
        description: `Your profile will be shown to more people for the next ${boostDuration} minutes.`,
      });
    } catch (error) {
      console.error('Error boosting profile:', error);
      toast({
        title: "Error",
        description: "Failed to boost profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isRecentlyBoosted = lastBoost && 
    (new Date().getTime() - lastBoost.getTime()) < (boostDuration * 60 * 1000);

  return (
    <Card className="border-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Profile Boost
          </CardTitle>
          {isRecentlyBoosted && (
            <Badge variant="secondary">
              <Clock size={12} className="mr-1" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Boost your profile to be seen by up to 10x more people for the next {boostDuration} minutes.
        </p>
        {canBoost && (
          <p className="text-xs text-muted-foreground">
            {monthlyBoosts === -1 ? 'Unlimited boosts' : `${monthlyBoosts} boosts / month`} included with your {tier} plan.
          </p>
        )}
        
        {!canBoost && (
          <div className="bg-accent border border-border rounded-lg p-3 flex items-start gap-2">
            <Crown className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Upgrade to <span className="font-semibold text-foreground">Premium</span> to unlock 5 boosts per month, or <span className="font-semibold text-foreground">Elite</span> for unlimited boosts.
            </p>
          </div>
        )}

        <Button 
          onClick={handleBoost}
          disabled={!canBoost || isLoading || isRecentlyBoosted}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
              Boosting...
            </>
          ) : isRecentlyBoosted ? (
            'Boost Active'
          ) : (
            <>
              <Zap size={16} className="mr-2" />
              Boost Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BoostProfile;
