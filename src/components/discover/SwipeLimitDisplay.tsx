
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, Heart } from 'lucide-react';
import { useSwipeLimits } from '@/hooks/useSwipeLimits';

const SwipeLimitDisplay = () => {
  const { remainingSwipes, isPremium, isLoading } = useSwipeLimits();

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPremium) {
    return (
      <Card className="mb-4 border-primary/20 bg-accent">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Premium Active</span>
            </div>
            <span className="text-sm text-muted-foreground">Unlimited swipes</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxSwipes = 50;
  const usedSwipes = maxSwipes - remainingSwipes;
  const progressPercentage = (usedSwipes / maxSwipes) * 100;

  return (
    <Card className="mb-4">
      <CardContent className="py-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Daily Swipes</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {remainingSwipes} remaining
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          {remainingSwipes <= 5 && remainingSwipes > 0 && (
            <p className="text-xs text-muted-foreground">
              Almost at your daily limit! Consider upgrading for unlimited swipes.
            </p>
          )}
          {remainingSwipes === 0 && (
            <p className="text-xs text-destructive">
              Daily limit reached. Come back tomorrow or upgrade to premium!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeLimitDisplay;
