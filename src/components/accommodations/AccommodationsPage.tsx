
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import AccommodationCard from './AccommodationCard';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import { Building } from 'lucide-react';

const fetchAccommodations = async (): Promise<Tables<'accommodations'>[]> => {
  const { data, error } = await supabase
    .from('accommodations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching accommodations:', error);
    throw new Error(error.message);
  }

  return data || [];
};

const AccommodationsPage = () => {
  const { data: accommodations, isLoading, isError } = useQuery<Tables<'accommodations'>[]>({
    queryKey: ['accommodations'],
    queryFn: fetchAccommodations,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Available Stays</h1>
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
        <p className="text-red-500 text-center">Error loading accommodations. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
       <h1 className="text-3xl font-bold mb-6 text-gray-800">Available Stays</h1>
      {(!accommodations || accommodations.length === 0) ? (
        <EmptyState
          icon={<Building size={48} />}
          title="No Accommodations Available"
          description="Check back later for places to stay."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accommodations.map((accommodation) => (
            <AccommodationCard
              key={accommodation.id} 
              accommodation={accommodation} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AccommodationsPage;
