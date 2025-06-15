
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import AccommodationCard from './AccommodationCard';
import EmptyState from '@/components/ui/empty-state';

type Accommodation = Tables<'accommodations'>;

const fetchEventDetails = async (eventId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event details:', error);
    throw new Error(error.message);
  }
  return data;
};

const fetchAccommodationsForEvent = async (eventId: string): Promise<Accommodation[]> => {
  const { data, error } = await supabase
    .from('event_accommodations')
    .select('accommodations(*)')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching accommodations:', error);
    throw new Error(error.message);
  }

  return data?.map(item => item.accommodations).filter((acc): acc is Accommodation => acc !== null) || [];
};

interface EventDetailsProps {
  eventId: string;
  onBack: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack }) => {
  const { data: event, isLoading: isLoadingEvent, isError: isErrorEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEventDetails(eventId),
    enabled: !!eventId,
  });

  const { data: accommodations, isLoading: isLoadingAcc, isError: isErrorAcc } = useQuery({
    queryKey: ['accommodations', eventId],
    queryFn: () => fetchAccommodationsForEvent(eventId),
    enabled: !!eventId,
  });

  if (isLoadingEvent) {
    return (
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (isErrorEvent || !event) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Could not load event details.</p>

        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to all events
      </Button>

      {event.image_url && (
        <img src={event.image_url} alt={event.name} className="w-full h-64 md:h-80 object-cover rounded-lg mb-6 shadow-lg" />
      )}
      
      <h1 className="text-3xl font-bold text-gray-800">{event.name}</h1>
      <p className="text-lg text-gray-600 mt-2">{event.description}</p>
      
      <div className="flex flex-col md:flex-row gap-x-6 gap-y-2 text-gray-700 mt-4">
          <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pink-500" />
              <span>{format(new Date(event.event_date), 'PPP p')}</span>
          </div>
          {(event.location_city || event.location_country) && (
              <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-500" />
                  <span>{`${event.location_city}, ${event.location_country}`}</span>
              </div>
          )}
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Recommended Accommodations</h2>
        {isLoadingAcc ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
          </div>
        ) : isErrorAcc ? (
          <p className="text-red-500">Could not load accommodations.</p>
        ) : accommodations && accommodations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accommodations.map(acc => (
              <AccommodationCard key={acc.id} accommodation={acc} />
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={<Building2 size={48} />}
            title="No Accommodations"
            description="No specific accommodations are recommended for this event yet."
          />
        )}
      </div>
    </div>
  );
};

export default EventDetails;

