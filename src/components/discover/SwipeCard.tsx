
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, GraduationCap, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNativeHaptics } from '@/hooks/useNativeHaptics';

interface Profile {
  id: string;
  first_name: string;
  age: number;
  bio: string;
  occupation: string;
  education: string;
  height_cm: number;
  interests: string[];
  looking_for: string[];
  location_city: string;
  location_state: string;
  distance_km: number;
  compatibility_score: number;
  is_verified: boolean;
  professional_badge: string;
  has_accommodation_available: boolean;
  profile_photos: { photo_url: string; is_primary: boolean }[];
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe?: (action: 'like' | 'pass' | 'super_like') => void;
  style?: React.CSSProperties;
  className?: string;
  isOnline?: boolean;
}

const SwipeCard = ({ profile, onSwipe, style, className, isOnline = false }: SwipeCardProps) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const { triggerSwipeHaptic } = useNativeHaptics();
  const primaryPhoto = profile.profile_photos?.find(p => p.is_primary);
  const photoUrl = primaryPhoto?.photo_url || profile.profile_photos?.[0]?.photo_url || '/placeholder.svg';

  const SWIPE_THRESHOLD = 100; // pixels to trigger swipe

  const handleSwipeAction = (action: 'like' | 'pass' | 'super_like') => {
    // Trigger haptic feedback immediately for instant tactile response
    triggerSwipeHaptic(action);
    
    // Show immediate visual feedback
    if (action === 'like') setSwipeDirection('right');
    else if (action === 'pass') setSwipeDirection('left');
    else if (action === 'super_like') setSwipeDirection('up');

    // Execute swipe with tiny delay for animation
    setTimeout(() => {
      onSwipe?.(action);
      setSwipeDirection(null);
    }, 200);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    if (swipeDirection) return; // Don't allow drag if already swiping
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || swipeDirection) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging || swipeDirection) return;
    
    setIsDragging(false);
    
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);
    
    // Determine swipe action based on drag distance and direction
    if (absX > SWIPE_THRESHOLD && absX > absY) {
      // Horizontal swipe
      handleSwipeAction(dragOffset.x > 0 ? 'like' : 'pass');
    } else if (dragOffset.y < -SWIPE_THRESHOLD && absY > absX) {
      // Upward swipe
      handleSwipeAction('super_like');
    } else {
      // Not enough distance, snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Calculate rotation based on horizontal drag
  const rotation = dragOffset.x * 0.1; // 0.1 degrees per pixel
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  const userIsOnline = isOnline;

  // Determine which overlay to show based on drag direction
  const getDragOverlay = () => {
    if (!isDragging) return null;
    
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);
    
    if (absX > 30 && absX > absY) {
      return dragOffset.x > 0 ? 'like' : 'pass';
    } else if (dragOffset.y < -30 && absY > absX) {
      return 'super_like';
    }
    return null;
  };

  const dragOverlay = getDragOverlay();

  return (
    <Card 
      className={cn(
        "h-96 w-80 relative overflow-hidden cursor-grab select-none touch-none",
        isDragging && "cursor-grabbing transition-none",
        !isDragging && "transition-all duration-200",
        swipeDirection === 'right' && "translate-x-12 opacity-50 scale-95 rotate-6",
        swipeDirection === 'left' && "-translate-x-12 opacity-50 scale-95 -rotate-6",
        swipeDirection === 'up' && "-translate-y-12 opacity-50 scale-95",
        className
      )} 
      style={{
        ...style,
        transform: isDragging 
          ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)` 
          : style?.transform,
        opacity: isDragging ? opacity : style?.opacity,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt={`${profile.first_name} profile photo`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-red-200" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
      
      {/* Swipe Feedback Overlay */}
      {(swipeDirection === 'right' || dragOverlay === 'like') && (
        <div className={cn(
          "absolute inset-0 bg-green-500/30 flex items-center justify-center pointer-events-none",
          dragOverlay === 'like' && "transition-opacity duration-100",
          isDragging && dragOverlay === 'like' && dragOffset.x > 50 ? "opacity-100" : isDragging ? "opacity-50" : "opacity-100"
        )}>
          <div className="text-green-500 text-6xl font-bold rotate-12 border-4 border-green-500 px-8 py-4 rounded-lg">
            LIKE
          </div>
        </div>
      )}
      {(swipeDirection === 'left' || dragOverlay === 'pass') && (
        <div className={cn(
          "absolute inset-0 bg-red-500/30 flex items-center justify-center pointer-events-none",
          dragOverlay === 'pass' && "transition-opacity duration-100",
          isDragging && dragOverlay === 'pass' && dragOffset.x < -50 ? "opacity-100" : isDragging ? "opacity-50" : "opacity-100"
        )}>
          <div className="text-red-500 text-6xl font-bold -rotate-12 border-4 border-red-500 px-8 py-4 rounded-lg">
            NOPE
          </div>
        </div>
      )}
      {(swipeDirection === 'up' || dragOverlay === 'super_like') && (
        <div className={cn(
          "absolute inset-0 bg-blue-500/30 flex items-center justify-center pointer-events-none",
          dragOverlay === 'super_like' && "transition-opacity duration-100",
          isDragging && dragOverlay === 'super_like' && dragOffset.y < -50 ? "opacity-100" : isDragging ? "opacity-50" : "opacity-100"
        )}>
          <div className="text-blue-500 text-6xl font-bold border-4 border-blue-500 px-8 py-4 rounded-lg">
            ⭐
          </div>
        </div>
      )}

      {/* Online Status Indicator */}
      {userIsOnline && (
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs border-green-300">
            <Circle size={8} className="fill-green-500 text-green-500 mr-1 animate-pulse" />
            Online
          </Badge>
        </div>
      )}

      {/* Swipe Instructions - hide while dragging */}
      {!isDragging && !swipeDirection && (
        <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg p-2 pointer-events-none">
          <div className="text-white text-xs space-y-1">
            <div>← Drag to Pass</div>
            <div>↑ Drag for Super Like</div>
            <div>→ Drag to Like</div>
          </div>
        </div>
      )}
      
      <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">
              {profile.first_name}, {profile.age}
            </h3>
            {userIsOnline && (
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
            )}
          </div>
          
          {profile.bio && (
            <p className="text-sm opacity-90 line-clamp-2">{profile.bio}</p>
          )}
          
          <div className="space-y-1">
            {profile.occupation && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase size={14} />
                <span>{profile.occupation}</span>
              </div>
            )}
            
            {(profile.location_city && profile.location_state) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} />
                <span>{profile.location_city}, {profile.location_state}</span>
              </div>
            )}

            {profile.distance_km && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} />
                <span>{Math.round(profile.distance_km)} km away</span>
              </div>
            )}
          </div>

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-white/20 text-white border-none">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwipeAction('pass');
            }}
            disabled={swipeDirection !== null}
            className="w-12 h-12 bg-secondary hover:bg-secondary/80 rounded-full flex items-center justify-center text-secondary-foreground transition-all shadow-lg hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            ✕
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwipeAction('super_like');
            }}
            disabled={swipeDirection !== null}
            className="w-12 h-12 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center text-primary-foreground transition-all shadow-lg hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            ⭐
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwipeAction('like');
            }}
            disabled={swipeDirection !== null}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            ♥
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeCard;
