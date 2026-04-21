import React from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useTierFeatures } from '@/hooks/useTierFeatures';
import { useToast } from '@/hooks/use-toast';

interface SuperLikeProps {
  profileId: string;
  onSuperLike: (profileId: string) => Promise<void>;
  disabled?: boolean;
}

const SuperLike = ({ profileId, onSuperLike, disabled }: SuperLikeProps) => {
  const { canUseSuperLike } = useTierFeatures();
  const { toast } = useToast();

  const handleSuperLike = async () => {
    if (!canUseSuperLike) {
      toast({ title: "Basic Plan Required", description: "Upgrade to Basic or higher to send Super Likes.", variant: "destructive" });
      return;
    }
    try {
      await onSuperLike(profileId);
      toast({ title: "Super Like Sent!", description: "Your super like has been sent successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send super like", variant: "destructive" });
    }
  };

  return (
    <Button onClick={handleSuperLike} disabled={disabled} variant="outline" size="icon" className="border-primary bg-primary/10 hover:bg-primary/20 text-primary">
      <Star size={20} fill="currentColor" />
    </Button>
  );
};

export default SuperLike;
