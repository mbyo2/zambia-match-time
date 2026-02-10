import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';

interface MatchedProfile {
  first_name: string;
  profile_photos: { photo_url: string; is_primary: boolean }[];
}

interface MatchCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchedProfile: MatchedProfile | null;
  onSendMessage?: () => void;
  onKeepSwiping?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'rect' | 'heart';
}

const CONFETTI_COLORS = [
  'hsl(var(--primary))',
  '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1',
  '#F78FB3', '#CF6A87', '#786FA6', '#FDA7DF',
];

const ConfettiCanvas = ({ active }: { active: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 40,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        velocityX: (Math.random() - 0.5) * 3,
        velocityY: 1.5 + Math.random() * 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape: (['circle', 'rect', 'heart'] as const)[Math.floor(Math.random() * 3)],
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (!active) return;
    createParticles();

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            rotation: p.rotation + p.rotationSpeed,
            velocityY: p.velocityY + 0.05,
          }))
          .filter(p => p.y < 120)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [active, createParticles]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.6 : p.size,
            backgroundColor: p.shape !== 'heart' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0',
            transform: `rotate(${p.rotation}deg)`,
            fontSize: p.shape === 'heart' ? p.size : undefined,
            color: p.color,
          }}
        >
          {p.shape === 'heart' && '❤'}
        </div>
      ))}
    </div>
  );
};

const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({
  open,
  onOpenChange,
  matchedProfile,
  onSendMessage,
  onKeepSwiping,
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowContent(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [open]);

  const photoUrl =
    matchedProfile?.profile_photos?.find(p => p.is_primary)?.photo_url ||
    matchedProfile?.profile_photos?.[0]?.photo_url ||
    '/placeholder.svg';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:hidden">
        <div className="relative flex flex-col items-center justify-center min-h-[480px] bg-gradient-to-b from-primary/90 via-primary/80 to-primary/60 rounded-2xl p-8 text-center">
          <ConfettiCanvas active={open} />

          {/* Pulsing hearts background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-64 h-64 text-primary-foreground/5 animate-pulse" />
          </div>

          <div
            className={`relative z-10 transition-all duration-700 ${
              showContent ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'
            }`}
          >
            {/* "It's a Match!" text */}
            <h2 className="text-4xl font-black text-primary-foreground mb-2 tracking-tight drop-shadow-lg">
              It's a Match! 🎉
            </h2>
            <p className="text-primary-foreground/80 text-sm mb-8">
              You and {matchedProfile?.first_name || 'someone'} liked each other
            </p>

            {/* Profile photo */}
            <div className="relative mx-auto mb-8">
              <div className="w-32 h-32 rounded-full border-4 border-primary-foreground/30 overflow-hidden shadow-2xl mx-auto ring-4 ring-primary-foreground/10 ring-offset-4 ring-offset-transparent">
                <img
                  src={photoUrl}
                  alt={matchedProfile?.first_name}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <div className="bg-primary-foreground text-primary text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {matchedProfile?.first_name}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 w-full max-w-xs mx-auto">
              <Button
                onClick={() => {
                  onSendMessage?.();
                  onOpenChange(false);
                }}
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold text-base py-6 rounded-full shadow-lg"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send a Message
              </Button>
              <Button
                onClick={() => {
                  onKeepSwiping?.();
                  onOpenChange(false);
                }}
                variant="ghost"
                className="w-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 font-medium rounded-full"
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchCelebrationModal;
