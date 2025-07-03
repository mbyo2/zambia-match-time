
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { Gift, Star, Zap, Heart } from 'lucide-react';

interface DailyRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ open, onOpenChange }) => {
  const { todayReward, claimDailyReward } = useDailyRewards();

  const handleClaim = async () => {
    const success = await claimDailyReward();
    if (success) {
      setTimeout(() => onOpenChange(false), 1500);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'super_like':
        return <Heart className="h-8 w-8 text-red-500" />;
      case 'boost':
        return <Zap className="h-8 w-8 text-orange-500" />;
      case 'points':
        return <Star className="h-8 w-8 text-yellow-500" />;
      default:
        return <Gift className="h-8 w-8 text-green-500" />;
    }
  };

  const getRewardText = (type: string, value: number) => {
    switch (type) {
      case 'super_like':
        return `${value} Super Like${value > 1 ? 's' : ''}`;
      case 'boost':
        return `${value} Profile Boost${value > 1 ? 's' : ''}`;
      case 'points':
        return `${value} Experience Points`;
      default:
        return `${value} ${type}`;
    }
  };

  if (!todayReward) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Daily Reward! 🎉</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-6">
          <div className="animate-bounce">
            {getRewardIcon(todayReward.reward_type)}
          </div>
          
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {getRewardText(todayReward.reward_type, todayReward.reward_value)}
            </Badge>
            <p className="text-muted-foreground">
              Come back tomorrow for another reward!
            </p>
          </div>

          {!todayReward.claimed ? (
            <Button onClick={handleClaim} size="lg" className="w-full">
              <Gift className="mr-2 h-4 w-4" />
              Claim Reward
            </Button>
          ) : (
            <div className="text-center">
              <Badge variant="outline" className="text-green-600">
                ✓ Already Claimed Today
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyRewardModal;
