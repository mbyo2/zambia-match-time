
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import AccommodationCard from './AccommodationCard';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Building, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const fetchUserAccommodationStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('has_accommodation_available')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user accommodation status:', error);
    return false;
  }

  return data?.has_accommodation_available || false;
};

const AccommodationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accommodations, isLoading, isError } = useQuery<Tables<'accommodations'>[]>({
    queryKey: ['accommodations'],
    queryFn: fetchAccommodations,
  });

  const { data: hasAccommodation, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['userAccommodationStatus', user?.id],
    queryFn: () => fetchUserAccommodationStatus(user!.id),
    enabled: !!user,
  });

  const { mutate: updateAccommodationStatus, isPending } = useMutation({
    mutationFn: async (hasAccommodation: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ has_accommodation_available: hasAccommodation })
        .eq('id', user!.id);

      if (error) throw error;
      return hasAccommodation;
    },
    onSuccess: (hasAccommodation) => {
      queryClient.setQueryData(['userAccommodationStatus', user?.id], hasAccommodation);
      toast({
        title: hasAccommodation ? "Accommodation Available!" : "Accommodation Status Updated",
        description: hasAccommodation 
          ? "Your profile now shows you have accommodation available."
          : "Your accommodation availability has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not update accommodation status.",
        variant: "destructive"
      });
    }
  });

  if (isLoading || isLoadingStatus) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Available Stays</h1>
      </div>

      {/* User Accommodation Status Card */}
      {user && (
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-green-600" />
              Your Accommodation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {hasAccommodation 
                    ? "You're currently offering accommodation to other users."
                    : "Let others know if you have accommodation available to share."
                  }
                </p>
                <p className="text-xs text-gray-500">
                  This will be visible to other users in the app.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {hasAccommodation ? "Available" : "Not Available"}
                </span>
                <Switch
                  checked={hasAccommodation || false}
                  onCheckedChange={(checked) => updateAccommodationStatus(checked)}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accommodations Grid */}
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
