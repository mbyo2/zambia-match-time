
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Edit, Shield, Crown, Heart, Eye, Camera } from 'lucide-react';
import PhotoUploadSection from './PhotoUploadSection';
import VerificationFlow from '../verification/VerificationFlow';

interface ProfilePageProps {
  setCurrentTab: (tab: string) => void;
}

interface Profile {
  id: string;
  first_name: string;
  last_name?: string;
  bio?: string;
  occupation?: string;
  education?: string;
  location_city?: string;
  location_state?: string;
  date_of_birth: string;
  interests: string[];
  is_verified: boolean;
  verification_status?: string;
}

interface ProfilePhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  order_index: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPhotos();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', user?.id)
        .order('order_index');

      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      setPhotos(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setShowVerification(false)}
            className="mb-4"
          >
            ← Back to Profile
          </Button>
          <VerificationFlow />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {photos.find(p => p.is_primary) ? (
                  <img
                    src={photos.find(p => p.is_primary)?.photo_url}
                    alt={profile.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-semibold">
                    {profile.first_name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  {profile.is_verified && (
                    <Badge className="bg-blue-500 text-white">
                      <Shield size={12} className="mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mb-2">
                  {calculateAge(profile.date_of_birth)} years old
                  {profile.location_city && ` • ${profile.location_city}`}
                  {profile.location_state && `, ${profile.location_state}`}
                </p>
                
                {profile.occupation && (
                  <p className="text-gray-600 mb-2">{profile.occupation}</p>
                )}
                
                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}
                
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setCurrentTab('profile-edit')} className="flex-1">
                <Edit size={16} className="mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" onClick={() => setCurrentTab('security')}>
                <Settings size={16} className="mr-2" />
                Settings
              </Button>
              {!profile.is_verified && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowVerification(true)}
                  className="text-blue-600 border-blue-200"
                >
                  <Shield size={16} className="mr-2" />
                  Get Verified
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>
          
          <TabsContent value="photos">
            <Card>
              <CardContent className="p-6">
                <PhotoUploadSection 
                  photos={photos} 
                  onPhotosUpdate={fetchPhotos}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-gray-500" />
                    <div>
                      <h3 className="font-semibold">Profile Views</h3>
                      <p className="text-sm text-gray-600">See who's been checking you out</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <div>
                      <h3 className="font-semibold">Likes Received</h3>
                      <p className="text-sm text-gray-600">People who liked your profile</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <p className="text-gray-500">Activity tracking coming soon!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="premium">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Crown className="h-12 w-12 text-yellow-500 mx-auto" />
                  <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
                  <p className="text-gray-600">
                    Get unlimited swipes, see who likes you, and more!
                  </p>
                  <Button 
                    onClick={() => setCurrentTab('subscription')}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600"
                  >
                    View Premium Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
