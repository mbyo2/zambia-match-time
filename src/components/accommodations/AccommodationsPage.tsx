
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
import { Building, Home, Users } from 'lucide-react';
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

const fetchUserStatus = async (userId: string): Promise<{ hasAccommodation: boolean; availableToMeet: boolean }> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('has_accommodation_available, search_preferences')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user status:', error);
    return { hasAccommodation: false, availableToMeet: false };
  }

  const availableToMeet = data?.search_preferences?.available_to_meet || false;
  return { 
    hasAccommodation: data?.has_accommodation_available || false,
    availableToMeet
  };
};

const AccommodationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accommodations, isLoading, isError } = useQuery<Tables<'accommodations'>[]>({
    queryKey: ['accommodations'],
    queryFn: fetchAccommodations,
  });

  const { data: userStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['userStatus', user?.id],
    queryFn: () => fetchUserStatus(user!.id),
    enabled: !!user,
  });

  const { mutate: updateAccommodationStatus, isPending: isPendingAccommodation } = useMutation({
    mutationFn: async (hasAccommodation: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ has_accommodation_available: hasAccommodation })
        .eq('id', user!.id);

      if (error) throw error;
      return hasAccommodation;
    },
    onSuccess: (hasAccommodation) => {
      queryClient.setQueryData(['userStatus', user?.id], (old: any) => ({
        ...old,
        hasAccommodation
      }));
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

  const { mutate: updateMeetingStatus, isPending: isPendingMeeting } = useMutation({
    mutationFn: async (availableToMeet: boolean) => {
      // Get current search preferences
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('search_preferences')
        .eq('id', user!.id)
        .single();

      const currentPreferences = currentProfile?.search_preferences || {};
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          search_preferences: {
            ...currentPreferences,
            available_to_meet: availableToMeet
          }
        })
        .eq('id', user!.id);

      if (error) throw error;
      return availableToMeet;
    },
    onSuccess: (availableToMeet) => {
      queryClient.setQueryData(['userStatus', user?.id], (old: any) => ({
        ...old,
        availableToMeet
      }));
      toast({
        title: availableToMeet ? "Available to Meet!" : "Meeting Status Updated",
        description: availableToMeet 
          ? "Your profile now shows you're available to meet."
          : "Your meeting availability has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not update meeting status.",
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

      {/* User Status Cards */}
      {user && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Accommodation Status Card */}
          <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-green-600" />
                Accommodation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {userStatus?.hasAccommodation 
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
                    {userStatus?.hasAccommodation ? "Available" : "Not Available"}
                  </span>
                  <Switch
                    checked={userStatus?.hasAccommodation || false}
                    onCheckedChange={(checked) => updateAccommodationStatus(checked)}
                    disabled={isPendingAccommodation}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available to Meet Status Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Available to Meet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {userStatus?.availableToMeet 
                      ? "You're currently available to meet with other travelers."
                      : "Let others know if you're available to meet up or hang out."
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    This helps other users find travel companions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {userStatus?.availableToMeet ? "Available" : "Not Available"}
                  </span>
                  <Switch
                    checked={userStatus?.availableToMeet || false}
                    onCheckedChange={(checked) => updateMeetingStatus(checked)}
                    disabled={isPendingMeeting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
