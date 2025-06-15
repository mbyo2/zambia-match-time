
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import EventCard from './EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import { CalendarOff } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

const fetchEvents = async (): Promise<Tables<'events'>[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw new Error(error.message);
  }

  return data || [];
};

const EventsPage = () => {
  const { data: events, isLoading, isError, error } = useQuery<Tables<'events'>[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <p className="text-red-500 text-center">Error loading events. Please try again later.</p>
        {/* For debugging: <p>{error.message}</p> */}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
       <h1 className="text-3xl font-bold mb-6 text-gray-800">Upcoming Events</h1>
      {(!events || events.length === 0) ? (
        <EmptyState
          icon={<CalendarOff size={48} />}
          title="No Upcoming Events"
          description="Check back later for local meetups and community events."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
