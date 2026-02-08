import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
  isTop?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const SwipeCard = ({ profile, onSwipe, isTop = true, style, className }: SwipeCardProps) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const { triggerSwipeHaptic } = useNativeHaptics();

  const photos = profile.profile_photos?.length > 0 
    ? profile.profile_photos 
    : [{ photo_url: '/placeholder.svg', is_primary: true }];
  
  const currentPhoto = photos[currentPhotoIndex]?.photo_url || '/placeholder.svg';

  const SWIPE_THRESHOLD = 120;
  const VELOCITY_THRESHOLD = 0.5;

  const handleSwipeAction = (action: 'like' | 'pass' | 'super_like') => {
    if (isExiting) return;
    
    triggerSwipeHaptic(action);
    setIsExiting(true);
    
    if (action === 'like') setExitDirection('right');
    else if (action === 'pass') setExitDirection('left');
    else if (action === 'super_like') setExitDirection('up');

    setTimeout(() => {
      onSwipe?.(action);
    }, 300);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isTop || isExiting) return;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || isExiting) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    setDragOffset({ x: deltaX, y: Math.min(0, deltaY) }); // Only allow upward drag
  };

  const handleDragEnd = (velocity: { x: number; y: number } = { x: 0, y: 0 }) => {
    if (!isDragging || isExiting) return;
    
    setIsDragging(false);
    
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);
    
    // Check velocity for quick flicks
    const isQuickFlick = Math.abs(velocity.x) > VELOCITY_THRESHOLD || Math.abs(velocity.y) > VELOCITY_THRESHOLD;
    const threshold = isQuickFlick ? SWIPE_THRESHOLD * 0.5 : SWIPE_THRESHOLD;
    
    if (absX > threshold && absX > absY) {
      handleSwipeAction(dragOffset.x > 0 ? 'like' : 'pass');
    } else if (dragOffset.y < -threshold && absY > absX) {
      handleSwipeAction('super_like');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Touch handlers
  const touchStartTime = useRef(0);
  const lastTouchPos = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartTime.current = Date.now();
    lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    const elapsed = Date.now() - touchStartTime.current;
    const velocity = {
      x: (lastTouchPos.current.x - dragStartRef.current.x) / Math.max(elapsed, 1) * 10,
      y: (lastTouchPos.current.y - dragStartRef.current.y) / Math.max(elapsed, 1) * 10
    };
    handleDragEnd(velocity);
  };

  // Mouse handlers
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
    if (isDragging) handleDragEnd();
  };

  // Photo navigation
  const nextPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  // Calculate transforms
  const rotation = dragOffset.x * 0.08;
  const likeOpacity = Math.min(dragOffset.x / 100, 1);
  const nopeOpacity = Math.min(-dragOffset.x / 100, 1);
  const superLikeOpacity = Math.min(-dragOffset.y / 80, 1);

  // Exit animation styles
  const getExitStyle = (): React.CSSProperties => {
    if (!isExiting) return {};
    
    switch (exitDirection) {
      case 'right':
        return { transform: 'translateX(150%) rotate(30deg)', opacity: 0 };
      case 'left':
        return { transform: 'translateX(-150%) rotate(-30deg)', opacity: 0 };
      case 'up':
        return { transform: 'translateY(-150%) scale(1.1)', opacity: 0 };
      default:
        return {};
    }
  };

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "absolute w-full h-full rounded-2xl overflow-hidden cursor-grab select-none shadow-2xl",
        isDragging && "cursor-grabbing",
        !isDragging && !isExiting && "transition-transform duration-200 ease-out",
        isExiting && "transition-all duration-300 ease-out pointer-events-none",
        !isTop && "pointer-events-none",
        className
      )} 
      style={{
        ...style,
        transform: isExiting 
          ? getExitStyle().transform 
          : isDragging 
            ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)` 
            : 'none',
        opacity: isExiting ? 0 : 1,
        touchAction: 'none',
      }}
      onTouchStart={isTop ? handleTouchStart : undefined}
      onTouchMove={isTop ? handleTouchMove : undefined}
      onTouchEnd={isTop ? handleTouchEnd : undefined}
      onMouseDown={isTop ? handleMouseDown : undefined}
      onMouseMove={isTop ? handleMouseMove : undefined}
      onMouseUp={isTop ? handleMouseUp : undefined}
      onMouseLeave={isTop ? handleMouseLeave : undefined}
    >
      {/* Photo */}
      <img 
        src={currentPhoto} 
        alt={`${profile.first_name}`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />

      {/* Photo indicators */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {photos.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                idx === currentPhotoIndex ? "bg-white" : "bg-white/40"
              )}
            />
          ))}
        </div>
      )}

      {/* Photo navigation zones */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prevPhoto}
            className="absolute left-0 top-0 bottom-20 w-1/3 z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-0 top-0 bottom-20 w-1/3 z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 text-white drop-shadow-lg" />
          </button>
        </>
      )}
      
      {/* LIKE stamp */}
      <div 
        className="absolute top-20 left-6 z-20 pointer-events-none"
        style={{ opacity: likeOpacity > 0 ? likeOpacity : 0 }}
      >
        <div className="border-4 border-green-500 text-green-500 text-4xl font-black px-4 py-2 rounded-lg rotate-[-20deg] bg-white/10 backdrop-blur-sm">
          LIKE
        </div>
      </div>

      {/* NOPE stamp */}
      <div 
        className="absolute top-20 right-6 z-20 pointer-events-none"
        style={{ opacity: nopeOpacity > 0 ? nopeOpacity : 0 }}
      >
        <div className="border-4 border-red-500 text-red-500 text-4xl font-black px-4 py-2 rounded-lg rotate-[20deg] bg-white/10 backdrop-blur-sm">
          NOPE
        </div>
      </div>

      {/* SUPER LIKE stamp */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        style={{ opacity: superLikeOpacity > 0 ? superLikeOpacity : 0 }}
      >
        <div className="border-4 border-blue-400 text-blue-400 text-4xl font-black px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm flex items-center gap-2">
          <Star className="w-8 h-8 fill-blue-400" />
          SUPER LIKE
        </div>
      </div>

      {/* Verified badge */}
      {profile.is_verified && (
        <div className="absolute top-14 right-4 z-10">
          <Badge className="bg-blue-500 text-white border-none">
            ✓ Verified
          </Badge>
        </div>
      )}
      
      {/* Profile info */}
      <CardContent className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <div className="space-y-2 mb-16">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold">{profile.first_name}</h2>
            <span className="text-2xl">{profile.age}</span>
          </div>
          
          {profile.occupation && (
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Briefcase size={14} />
              <span>{profile.occupation}</span>
            </div>
          )}
          
          {(profile.location_city || profile.distance_km) && (
            <div className="flex items-center gap-2 text-sm opacity-90">
              <MapPin size={14} />
              <span>
                {profile.distance_km 
                  ? `${Math.round(profile.distance_km)} km away` 
                  : `${profile.location_city}${profile.location_state ? `, ${profile.location_state}` : ''}`
                }
              </span>
            </div>
          )}

          {profile.bio && (
            <p className="text-sm opacity-80 line-clamp-2 mt-2">{profile.bio}</p>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.interests.slice(0, 4).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-white/20 text-white border-none backdrop-blur-sm">
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 4 && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-none backdrop-blur-sm">
                  +{profile.interests.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Action buttons - Tinder style */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-5 z-20 px-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSwipeAction('pass');
          }}
          disabled={isExiting}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 border-2 border-transparent hover:border-red-400"
        >
          <X className="w-7 h-7 text-red-500" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSwipeAction('super_like');
          }}
          disabled={isExiting}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 border-2 border-transparent hover:border-blue-400"
        >
          <Star className="w-6 h-6 text-blue-500" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSwipeAction('like');
          }}
          disabled={isExiting}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 border-2 border-transparent hover:border-green-400"
        >
          <Heart className="w-7 h-7 text-green-500" />
        </button>
      </div>
    </Card>
  );
};

export default SwipeCard;
