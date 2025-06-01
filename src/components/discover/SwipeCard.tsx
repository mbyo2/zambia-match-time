
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, GraduationCap } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  bio?: string;
  occupation?: string;
  education?: string;
  location_city?: string;
  location_state?: string;
  date_of_birth: string;
}

interface SwipeCardProps {
  profile: Profile;
  style?: React.CSSProperties;
  className?: string;
}

const SwipeCard = ({ profile, style, className }: SwipeCardProps) => {
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

  return (
    <Card className={`h-96 w-80 relative overflow-hidden ${className}`} style={style}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-red-200" />
      
      <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">
            {profile.first_name}, {calculateAge(profile.date_of_birth)}
          </h3>
          
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeCard;
