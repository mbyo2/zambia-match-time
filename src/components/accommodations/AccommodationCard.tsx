
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, DollarSign } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface AccommodationCardProps {
  accommodation: Tables<'accommodations'>;
}

const AccommodationCard: React.FC<AccommodationCardProps> = ({ accommodation }) => {
  return (
    <Card className="overflow-hidden shadow-md">
      {accommodation.image_url && (
        <img
          src={accommodation.image_url}
          alt={accommodation.name}
          className="w-full h-48 object-cover"
        />
      )}
      <CardHeader>
        <CardTitle>{accommodation.name}</CardTitle>
        <CardDescription>{accommodation.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-gray-600">
        {(accommodation.location_city || accommodation.location_country) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{`${accommodation.location_city}, ${accommodation.location_country}`}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span>{`${accommodation.price_per_night} / night`}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccommodationCard;
