
import React from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface SuperLikeProps {
  profileId: string;
  onSuperLike: (profileId: string) => Promise<void>;
  disabled?: boolean;
}

const SuperLike = ({ profileId, onSuperLike, disabled }: SuperLikeProps) => {
  const { subscription } = useSubscription();
  const { toast } = useToast();

  const handleSuperLike = async () => {
    if (subscription.tier === 'free') {
      toast({
        title: "Premium Feature",
        description: "Super likes are available for premium users only!",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSuperLike(profileId);
      toast({
        title: "Super Like Sent!",
        description: "Your super like has been sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send super like",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleSuperLike}
      disabled={disabled}
      variant="outline"
      size="icon"
      className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
    >
      <Star size={20} fill="currentColor" />
    </Button>
  );
};

export default SuperLike;
