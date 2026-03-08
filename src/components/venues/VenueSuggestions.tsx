import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Venue {
  id: string;
  name: string;
  description: string | null;
  location_city: string | null;
  location_country: string | null;
  type: string;
  price_per_night: number;
  image_url: string | null;
}

interface VenueSuggestionsProps {
  /** Optional city to filter venues by */
  city?: string;
  className?: string;
}

const VenueSuggestions: React.FC<VenueSuggestionsProps> = ({ city, className }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, [city]);

  const fetchVenues = async () => {
    try {
      let query = supabase
        .from('accommodations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (city) {
        query = query.ilike('location_city', `%${city}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setVenues(data);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || venues.length === 0) return null;

  const typeEmoji: Record<string, string> = {
    hotel: '🏨',
    apartment: '🏢',
    resort: '🌴',
    villa: '🏡',
    cabin: '🏕️',
  };

  return (
    <div className={cn("py-3", className)}>
      <div className="flex items-center gap-2 px-4 mb-2">
        <Star className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sponsored · Date spots nearby
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="flex-shrink-0 w-48 rounded-xl overflow-hidden bg-card border border-border shadow-sm"
          >
            <div className="h-24 bg-muted relative">
              {venue.image_url ? (
                <img
                  src={venue.image_url}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  {typeEmoji[venue.type] || '🏨'}
                </div>
              )}
              <span className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-[10px] font-bold px-1.5 py-0.5 rounded-full text-foreground">
                ${venue.price_per_night}/night
              </span>
            </div>
            <div className="p-2.5">
              <h4 className="text-xs font-semibold text-foreground truncate">{venue.name}</h4>
              {venue.location_city && (
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {venue.location_city}
                  {venue.location_country ? `, ${venue.location_country}` : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueSuggestions;
