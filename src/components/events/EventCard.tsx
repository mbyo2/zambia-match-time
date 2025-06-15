
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

interface EventCardProps {
  event: Tables<'events'>;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.name}
          className="w-full h-48 object-cover"
        />
      )}
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
        <CardDescription>{event.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(event.event_date), 'PPP p')}</span>
        </div>
        {(event.location_city || event.location_country) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{`${event.location_city}, ${event.location_country}`}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
