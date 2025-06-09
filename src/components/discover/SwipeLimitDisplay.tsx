
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
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPremium) {
    return (
      <Card className="mb-4 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Premium Active</span>
            </div>
            <span className="text-sm text-yellow-700">Unlimited swipes</span>
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
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium">Daily Swipes</span>
            </div>
            <span className="text-sm text-gray-600">
              {remainingSwipes} remaining
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          {remainingSwipes <= 5 && remainingSwipes > 0 && (
            <p className="text-xs text-amber-600">
              Almost at your daily limit! Consider upgrading for unlimited swipes.
            </p>
          )}
          {remainingSwipes === 0 && (
            <p className="text-xs text-red-600">
              Daily limit reached. Come back tomorrow or upgrade to premium!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeLimitDisplay;
