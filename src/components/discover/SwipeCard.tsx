import React, { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Heart, X, Star, ChevronLeft, ChevronRight, GraduationCap, Ruler, Shield } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(false);
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
    setTimeout(() => { onSwipe?.(action); }, 300);
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
    setDragOffset({ x: deltaX, y: Math.min(0, deltaY) });
  };

  const handleDragEnd = (velocity: { x: number; y: number } = { x: 0, y: 0 }) => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);
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

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); };
  const handleMouseMove = (e: React.MouseEvent) => { handleDragMove(e.clientX, e.clientY); };
  const handleMouseUp = () => { handleDragEnd(); };
  const handleMouseLeave = () => { if (isDragging) handleDragEnd(); };

  const nextPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex < photos.length - 1) setCurrentPhotoIndex(prev => prev + 1);
  };

  const prevPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex > 0) setCurrentPhotoIndex(prev => prev - 1);
  };

  const rotation = dragOffset.x * 0.08;
  const likeOpacity = Math.min(dragOffset.x / 100, 1);
  const nopeOpacity = Math.min(-dragOffset.x / 100, 1);
  const superLikeOpacity = Math.min(-dragOffset.y / 80, 1);

  const getExitStyle = (): React.CSSProperties => {
    if (!isExiting) return {};
    switch (exitDirection) {
      case 'right': return { transform: 'translateX(150%) rotate(30deg)', opacity: 0 };
      case 'left': return { transform: 'translateX(-150%) rotate(-30deg)', opacity: 0 };
      case 'up': return { transform: 'translateY(-150%) scale(1.1)', opacity: 0 };
      default: return {};
    }
  };

  const educationLabel = (edu: string) => {
    const map: Record<string, string> = {
      high_school: 'High School', some_college: 'Some College', bachelors: "Bachelor's",
      masters: "Master's", phd: 'PhD', trade_school: 'Trade School', other: 'Other'
    };
    return map[edu] || edu;
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "absolute w-full h-full rounded-3xl overflow-hidden cursor-grab select-none",
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
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
      onTouchStart={isTop ? handleTouchStart : undefined}
      onTouchMove={isTop ? handleTouchMove : undefined}
      onTouchEnd={isTop ? handleTouchEnd : undefined}
      onMouseDown={isTop ? handleMouseDown : undefined}
      onMouseMove={isTop ? handleMouseMove : undefined}
      onMouseUp={isTop ? handleMouseUp : undefined}
      onMouseLeave={isTop ? handleMouseLeave : undefined}
    >
      {/* Full-bleed photo */}
      <div className="absolute inset-0 bg-muted">
        <img 
          src={currentPhoto} 
          alt={profile.first_name}
          className="w-full h-full object-cover"
          draggable={false}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
        />
      </div>
      
      {/* Top gradient for photo indicators */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
      
      {/* Bottom gradient for profile info */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 transition-all duration-300",
        showDetails ? "h-[65%] bg-gradient-to-b from-transparent via-black/70 to-black/95" : "h-[45%] bg-gradient-to-b from-transparent to-black/80"
      )} />

      {/* Photo indicators - pill style */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10">
          {photos.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex-1 h-1 rounded-full transition-all duration-300",
                idx === currentPhotoIndex 
                  ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                  : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      {/* Photo navigation - tap zones */}
      {photos.length > 1 && (
        <>
          <button onClick={prevPhoto} className="absolute left-0 top-0 bottom-24 w-1/3 z-10" />
          <button onClick={nextPhoto} className="absolute right-0 top-0 bottom-24 w-1/3 z-10" />
        </>
      )}

      {/* LIKE stamp */}
      <div className="absolute top-24 left-6 z-20 pointer-events-none" style={{ opacity: Math.max(0, likeOpacity) }}>
        <div className="border-[3px] border-emerald-400 text-emerald-400 text-4xl font-black px-5 py-2 rounded-xl rotate-[-15deg] backdrop-blur-md bg-emerald-500/10">
          LIKE
        </div>
      </div>

      {/* NOPE stamp */}
      <div className="absolute top-24 right-6 z-20 pointer-events-none" style={{ opacity: Math.max(0, nopeOpacity) }}>
        <div className="border-[3px] border-rose-400 text-rose-400 text-4xl font-black px-5 py-2 rounded-xl rotate-[15deg] backdrop-blur-md bg-rose-500/10">
          NOPE
        </div>
      </div>

      {/* SUPER LIKE stamp */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ opacity: Math.max(0, superLikeOpacity) }}>
        <div className="border-[3px] border-sky-400 text-sky-400 text-4xl font-black px-6 py-3 rounded-xl backdrop-blur-md bg-sky-500/10 flex items-center gap-2">
          <Star className="w-8 h-8 fill-sky-400" />
          SUPER
        </div>
      </div>

      {/* Top-right badges */}
      <div className="absolute top-12 right-4 z-10 flex flex-col gap-2">
        {profile.is_verified && (
          <div className="flex items-center gap-1 bg-sky-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
            <Shield className="w-3 h-3" />
            Verified
          </div>
        )}
        {profile.compatibility_score > 0 && (
          <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg text-center">
            {profile.compatibility_score}% match
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
        <div className={cn("space-y-2 transition-all duration-300", showDetails ? "mb-20" : "mb-[72px]")}>
          {/* Name & age */}
          <div className="flex items-end gap-2">
            <h2 className="text-[28px] font-bold leading-tight tracking-tight">{profile.first_name}</h2>
            <span className="text-[22px] font-light opacity-90 mb-0.5">{profile.age}</span>
          </div>
          
          {/* Quick info row */}
          <div className="flex items-center gap-3 text-sm">
            {profile.occupation && (
              <span className="flex items-center gap-1.5 opacity-90">
                <Briefcase size={13} className="opacity-70" />
                {profile.occupation}
              </span>
            )}
            {profile.distance_km && (
              <span className="flex items-center gap-1 opacity-70">
                <MapPin size={13} />
                {Math.round(profile.distance_km)} km
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className={cn(
              "text-sm opacity-80 leading-relaxed",
              showDetails ? "line-clamp-4" : "line-clamp-2"
            )}>{profile.bio}</p>
          )}

          {/* Expand/collapse details */}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className="text-xs text-white/60 hover:text-white/90 transition-colors font-medium"
          >
            {showDetails ? 'Show less ▲' : 'More about me ▼'}
          </button>

          {/* Expanded details */}
          {showDetails && (
            <div className="space-y-3 pt-1 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-wrap gap-2">
                {profile.education && (
                  <span className="flex items-center gap-1 text-xs bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <GraduationCap size={12} /> {educationLabel(profile.education)}
                  </span>
                )}
                {profile.height_cm > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <Ruler size={12} /> {profile.height_cm} cm
                  </span>
                )}
                {profile.location_city && (
                  <span className="flex items-center gap-1 text-xs bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <MapPin size={12} /> {profile.location_city}
                  </span>
                )}
                {profile.has_accommodation_available && (
                  <span className="text-xs bg-emerald-500/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    🏠 Has accommodation
                  </span>
                )}
              </div>

              {profile.looking_for && profile.looking_for.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.looking_for.map((goal, i) => (
                    <span key={i} className="text-xs bg-primary/30 backdrop-blur-sm px-2.5 py-1 rounded-full capitalize">
                      {goal}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.interests.slice(0, showDetails ? 8 : 4).map((interest, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-white/15 backdrop-blur-sm text-white px-2.5 py-1 rounded-full"
                >
                  {interest}
                </span>
              ))}
              {!showDetails && profile.interests.length > 4 && (
                <span className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                  +{profile.interests.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center items-center gap-4 z-20 px-6">
        <button
          onClick={(e) => { e.stopPropagation(); handleSwipeAction('pass'); }}
          disabled={isExiting}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 bg-white/95 backdrop-blur-sm border border-white/20"
        >
          <X className="w-6 h-6 text-destructive" />
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); handleSwipeAction('super_like'); }}
          disabled={isExiting}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 bg-white/95 backdrop-blur-sm border border-white/20"
        >
          <Star className="w-5 h-5 text-sky-500" />
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); handleSwipeAction('like'); }}
          disabled={isExiting}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 bg-primary/95 backdrop-blur-sm border border-primary/20"
        >
          <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default SwipeCard;
