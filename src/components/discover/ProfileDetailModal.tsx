import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Briefcase, GraduationCap, Ruler, Shield, Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ProfileDetailModalProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwipe?: (action: 'like' | 'pass' | 'super_like') => void;
}

const educationLabel = (edu: string) => {
  const map: Record<string, string> = {
    high_school: 'High School', some_college: 'Some College', bachelors: "Bachelor's",
    masters: "Master's", phd: 'PhD', trade_school: 'Trade School', other: 'Other'
  };
  return map[edu] || edu;
};

const ProfileDetailModal = ({ profile, open, onOpenChange, onSwipe }: ProfileDetailModalProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = profile.profile_photos?.length > 0
    ? profile.profile_photos
    : [{ photo_url: '/placeholder.svg', is_primary: true }];

  const handleAction = (action: 'like' | 'pass' | 'super_like') => {
    onOpenChange(false);
    onSwipe?.(action);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl max-h-[90vh]">
        {/* Photo section */}
        <div className="relative aspect-[3/4] max-h-[50vh] bg-muted">
          <img
            src={photos[photoIndex]?.photo_url || '/placeholder.svg'}
            alt={profile.first_name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
          />

          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all",
                    idx === photoIndex ? "bg-white" : "bg-white/30"
                  )}
                />
              ))}
            </div>
          )}

          {/* Photo nav */}
          {photos.length > 1 && (
            <>
              {photoIndex > 0 && (
                <button
                  onClick={() => setPhotoIndex(i => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {photoIndex < photos.length - 1 && (
                <button
                  onClick={() => setPhotoIndex(i => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}

          {/* Badges overlay */}
          <div className="absolute top-10 right-3 flex flex-col gap-1.5">
            {profile.is_verified && (
              <span className="flex items-center gap-1 bg-sky-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <Shield size={11} /> Verified
              </span>
            )}
            {profile.compatibility_score > 0 && (
              <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full text-center">
                {profile.compatibility_score}% match
              </span>
            )}
          </div>
        </div>

        {/* Profile details */}
        <ScrollArea className="max-h-[35vh]">
          <div className="p-5 space-y-4">
            {/* Name row */}
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-foreground">{profile.first_name}</h2>
              <span className="text-xl text-muted-foreground">{profile.age}</span>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.occupation && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-primary" /> {profile.occupation}
                </span>
              )}
              {profile.location_city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" /> {profile.location_city}
                  {profile.distance_km ? ` · ${Math.round(profile.distance_km)} km` : ''}
                </span>
              )}
              {profile.education && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-primary" /> {educationLabel(profile.education)}
                </span>
              )}
              {profile.height_cm > 0 && (
                <span className="flex items-center gap-1.5">
                  <Ruler size={14} className="text-primary" /> {profile.height_cm} cm
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Looking for */}
            {profile.looking_for?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">Looking for</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.looking_for.map((goal, i) => (
                    <Badge key={i} variant="secondary" className="capitalize text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.has_accommodation_available && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg px-3 py-2">
                🏠 Has accommodation available
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex justify-center items-center gap-4 p-4 border-t border-border bg-background">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full border-destructive/30 hover:bg-destructive/10"
            onClick={() => handleAction('pass')}
          >
            <X className="w-5 h-5 text-destructive" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-full border-sky-400/30 hover:bg-sky-500/10"
            onClick={() => handleAction('super_like')}
          >
            <Star className="w-4 h-4 text-sky-500" />
          </Button>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={() => handleAction('like')}
          >
            <Heart className="w-5 h-5 fill-primary-foreground" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDetailModal;
