
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
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe?: (profileId: string, action: 'like' | 'pass') => void;
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
  const photoUrl = primaryPhoto?.photo_url || profile.profile_photos?.[0]?.photo_url;

  return (
    <Card className={`h-96 w-80 relative overflow-hidden ${className}`} style={style}>
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt={profile.first_name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-red-200" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
      
      {/* Online Status Indicator */}
      {isOnline && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs border-green-300">
            <Circle size={8} className="fill-green-500 text-green-500 mr-1 animate-pulse" />
            Online
          </Badge>
        </div>
      )}
      
      <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">
              {profile.first_name}, {calculateAge(profile.date_of_birth)}
            </h3>
            {isOnline && (
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
      </CardContent>
    </Card>
  );
};

export default SwipeCard;
