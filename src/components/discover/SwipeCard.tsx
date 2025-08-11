
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, GraduationCap, Circle } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  bio?: string;
  occupation?: string;
  education?: string;
  location_city?: string;
  location_state?: string;
  date_of_birth: string;
  height_cm?: number;
  interests: string[];
  relationship_goals: string[];
  distance_km?: number;
  compatibility_score?: number;
  profile_photos: { photo_url: string; is_primary: boolean }[];
  last_active?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe?: (action: 'like' | 'pass' | 'super_like') => void;
  style?: React.CSSProperties;
  className?: string;
  isOnline?: boolean;
}

const SwipeCard = ({ profile, onSwipe, style, className, isOnline = false }: SwipeCardProps) => {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const primaryPhoto = profile.profile_photos?.find(p => p.is_primary);
  const photoUrl = primaryPhoto?.photo_url || profile.profile_photos?.[0]?.photo_url || '/placeholder.svg';

  const handleCardClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width * 0.3) {
      onSwipe?.('pass');
    } else if (x > width * 0.7) {
      onSwipe?.('like');
    } else {
      onSwipe?.('super_like');
    }
  };

  const checkOnlineStatus = () => {
    // Check if user was active in last 15 minutes
    const lastActive = new Date(profile.last_active || '');
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
    return diffMinutes <= 15;
  };

  const userIsOnline = checkOnlineStatus();

  return (
    <Card 
      className={`h-96 w-80 relative overflow-hidden cursor-pointer select-none ${className}`} 
      style={style}
      onClick={handleCardClick}
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
      
      {/* Online Status Indicator */}
      {userIsOnline && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs border-green-300">
            <Circle size={8} className="fill-green-500 text-green-500 mr-1 animate-pulse" />
            Online
          </Badge>
        </div>
      )}

      {/* Swipe Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg p-2">
        <div className="text-white text-xs space-y-1">
          <div>← Pass</div>
          <div>Center: Super Like</div>
          <div>Like →</div>
        </div>
      </div>
      
      <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">
              {profile.first_name}, {calculateAge(profile.date_of_birth)}
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
            
            {profile.education && (
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap size={14} />
                <span className="capitalize">{profile.education.replace('_', ' ')}</span>
              </div>
            )}
            
            {(profile.location_city || profile.location_state) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} />
                <span>
                  {profile.location_city}
                  {profile.location_city && profile.location_state && ', '}
                  {profile.location_state}
                </span>
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
              onSwipe?.('pass');
            }}
            className="w-12 h-12 bg-secondary hover:bg-secondary/80 rounded-full flex items-center justify-center text-secondary-foreground transition-colors shadow-lg"
          >
            ✕
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwipe?.('super_like');
            }}
            className="w-12 h-12 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center text-primary-foreground transition-colors shadow-lg"
          >
            ⭐
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwipe?.('like');
            }}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
          >
            ♥
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeCard;
