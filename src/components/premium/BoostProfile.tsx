
import React, { useEffect, useState } from 'react';
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
  const [activeUntil, setActiveUntil] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const canBoost = canUseBoost;
  const boostDuration = 30; // minutes

  // Load active boost on mount and tick every second
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('boosts')
        .select('expires_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.expires_at) setActiveUntil(new Date(data.expires_at));
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!activeUntil) return;
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, [activeUntil]);

  const handleBoost = async () => {
    setIsLoading(true);
    try {
      // Server-side: validates tier (Premium+) and monthly quota.
      const { data, error } = await supabase.rpc('consume_boost' as any, { p_duration_minutes: boostDuration });
      if (error) throw error;
      const result = (data ?? {}) as { allowed?: boolean; reason?: string; required_tier?: string };
      if (!result.allowed) {
        if (result.reason === 'tier_required') {
          toast({ title: 'Upgrade Required', description: `Boost requires ${result.required_tier ?? 'Premium'} or higher.`, variant: 'destructive' });
        } else if (result.reason === 'monthly_limit_reached') {
          toast({ title: 'Monthly Limit Reached', description: 'You have used all your boosts for this month.', variant: 'destructive' });
        } else {
          toast({ title: 'Action Not Allowed', description: 'Could not boost your profile.', variant: 'destructive' });
        }
        return;
      }
      const expires = (data as any)?.expires_at
        ? new Date((data as any).expires_at)
        : new Date(Date.now() + boostDuration * 60 * 1000);
      setActiveUntil(expires);
      toast({
        title: 'Profile Boosted!',
        description: `Your profile will be shown to more people for the next ${boostDuration} minutes.`,
      });
    } catch (error) {
      console.error('Error boosting profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to boost profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isRecentlyBoosted = !!activeUntil && activeUntil.getTime() > now.getTime();
  const remainingMs = isRecentlyBoosted ? activeUntil!.getTime() - now.getTime() : 0;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);
  const remainingLabel = `${remainingMin}:${String(remainingSec).padStart(2, '0')}`;

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
              {remainingLabel} left
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
            `Boost Active · ${remainingLabel}`
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
