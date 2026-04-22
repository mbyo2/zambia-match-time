import React from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SuperLikeProps {
  profileId: string;
  onSuperLike: (profileId: string) => Promise<void>;
  disabled?: boolean;
}

const SuperLike = ({ profileId, onSuperLike, disabled }: SuperLikeProps) => {
  const { toast } = useToast();

  const handleSuperLike = async () => {
    try {
      // Server-side enforcement: tier + daily quota are validated in the RPC.
      const { data, error } = await supabase.rpc('consume_super_like' as any);
      if (error) throw error;
      const result = (data ?? {}) as { allowed?: boolean; reason?: string; required_tier?: string };
      if (!result.allowed) {
        if (result.reason === 'tier_required') {
          toast({ title: 'Upgrade Required', description: `Super Likes require ${result.required_tier ?? 'Basic'} or higher.`, variant: 'destructive' });
        } else if (result.reason === 'daily_limit_reached') {
          toast({ title: 'Daily Limit Reached', description: 'You have used all your Super Likes for today.', variant: 'destructive' });
        } else {
          toast({ title: 'Action Not Allowed', description: 'Could not send Super Like.', variant: 'destructive' });
        }
        return;
      }
      await onSuperLike(profileId);
      toast({ title: 'Super Like Sent!', description: 'Your super like has been sent successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send super like', variant: 'destructive' });
    }
  };

  return (
    <Button onClick={handleSuperLike} disabled={disabled} variant="outline" size="icon" className="border-primary bg-primary/10 hover:bg-primary/20 text-primary">
      <Star size={20} fill="currentColor" />
    </Button>
  );
};

export default SuperLike;
