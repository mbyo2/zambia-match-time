
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditPageProps {
  onBack: () => void;
}

interface ProfilePhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  order_index: number;
}

const ProfileEditPage: React.FC<ProfileEditPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    occupation: '',
    education: '',
    height_cm: '',
    interests: [] as string[],
    relationship_goals: [] as string[]
  });

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

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          bio: data.bio || '',
          occupation: data.occupation || '',
          education: data.education || '',
          height_cm: data.height_cm?.toString() || '',
          interests: data.interests || [],
          relationship_goals: data.relationship_goals || []
        });
      }
    } catch (error) {
      console.error('Error:', error);
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

  const updateProfile = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          occupation: profile.occupation,
          education: profile.education,
          height_cm: profile.height_cm ? parseInt(profile.height_cm) : null,
          interests: profile.interests,
          relationship_goals: profile.relationship_goals,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll show a placeholder - actual file upload would need storage setup
    toast({
      title: "Feature coming soon!",
      description: "Photo upload will be available when storage is configured.",
    });
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photoId);

      if (error) {
        console.error('Error deleting photo:', error);
        return;
      }

      setPhotos(photos.filter(p => p.id !== photoId));
      toast({
        title: "Success",
        description: "Photo deleted successfully!",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      // First, unset all photos as primary
      await supabase
        .from('profile_photos')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Then set the selected photo as primary
      const { error } = await supabase
        .from('profile_photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      if (error) {
        console.error('Error setting primary photo:', error);
        return;
      }

      setPhotos(photos.map(p => ({ ...p, is_primary: p.id === photoId })));
      toast({
        title: "Success",
        description: "Primary photo updated!",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
        </div>

        {/* Photo Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.photo_url}
                    alt="Profile"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {photo.is_primary && (
                    <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {!photo.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryPhoto(photo.id)}
                        className="h-6 w-6 p-0"
                      >
                        ⭐
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePhoto(photo.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              ))}
              
              {photos.length < 6 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-pink-500">
                  <div className="text-center">
                    <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Add Photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell people about yourself..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                placeholder="What do you do for work?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="education">Education</Label>
                <Select 
                  value={profile.education} 
                  onValueChange={(value) => setProfile({ ...profile, education: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="some_college">Some College</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="trade_school">Trade School</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height_cm}
                  onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                  placeholder="170"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={updateProfile}
                disabled={isLoading}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileEditPage;
