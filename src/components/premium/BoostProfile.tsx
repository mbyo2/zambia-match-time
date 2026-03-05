
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BoostProfile = () => {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastBoost, setLastBoost] = useState<Date | null>(null);

  const canBoost = subscription.tier !== 'free';
  const boostDuration = 30; // minutes

  const handleBoost = async () => {
    if (!canBoost) {
      toast({
        title: "Premium Feature",
        description: "Profile boost is available for premium users only!",
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
        
        {!canBoost && (
          <div className="bg-accent border border-border rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Upgrade to premium to use profile boost feature.
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
