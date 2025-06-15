
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';
import { MapPin, DollarSign } from 'lucide-react';

interface AccommodationCardProps {
  accommodation: Tables<'accommodations'>;
}

const AccommodationCard: React.FC<AccommodationCardProps> = ({ accommodation }) => {
  return (
    <Card className="overflow-hidden shadow-md flex flex-col">
      {accommodation.image_url && (
        <img
          src={accommodation.image_url}
          alt={accommodation.name}
          className="w-full h-40 object-cover"
        />
      )}
      <CardHeader>
        <CardTitle>{accommodation.name}</CardTitle>
        <CardDescription>{accommodation.type}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-gray-600 flex-grow">
        <p className="text-gray-700">{accommodation.description}</p>
        {(accommodation.location_city || accommodation.location_country) && (
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{`${accommodation.location_city}, ${accommodation.location_country}`}</span>
            </div>
        )}
        {typeof accommodation.price_per_night === 'number' && (
          <div className="flex items-center gap-2 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>{`${accommodation.price_per_night} / night`}</span>
          </div>
        )}
      </CardContent>
      {accommodation.booking_url && (
        <div className="p-4 mt-auto border-t">
            <Button asChild className="w-full">
                <a href={accommodation.booking_url} target="_blank" rel="noopener noreferrer">
                Book Now
                </a>
            </Button>
        </div>
      )}
    </Card>
  );
};

export default AccommodationCard;

