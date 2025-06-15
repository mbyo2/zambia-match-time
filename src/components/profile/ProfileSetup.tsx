import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EducationLevel = Database['public']['Enums']['education_level'];
type GenderType = Database['public']['Enums']['gender_type'];

const ProfileSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    occupation: '',
    education: '' as EducationLevel,
    location_city: '',
    location_state: '',
    interested_in: ['male', 'female'] as GenderType[],
    age_min: 18,
    age_max: 35,
    has_accommodation_available: false,
    available_to_meet: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          date_of_birth: '1990-01-01', // We'll need to collect this properly
          gender: 'prefer_not_to_say' as GenderType,
          bio: profileData.bio,
          occupation: profileData.occupation,
          education: profileData.education || undefined,
          location_city: profileData.location_city,
          location_state: profileData.location_state,
          interested_in: profileData.interested_in,
          age_min: profileData.age_min,
          age_max: profileData.age_max,
          has_accommodation_available: profileData.has_accommodation_available,
          search_preferences: {
            distance: 50,
            age_range: { min: profileData.age_min, max: profileData.age_max },
            interests: [],
            height_range: { min: 150, max: 200 },
            education_levels: [],
            relationship_goals: [],
            available_to_meet: profileData.available_to_meet
          }
        });

      if (error) {
        console.error('Profile creation error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile created successfully!",
        });
        // The parent component will handle the redirect
        window.location.reload();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <CardDescription>Tell us about yourself to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell people about yourself..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="education">Education</Label>
                <Select 
                  value={profileData.education} 
                  onValueChange={(value: EducationLevel) => setProfileData({ ...profileData, education: value })}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileData.location_city}
                  onChange={(e) => setProfileData({ ...profileData, location_city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profileData.location_state}
                  onChange={(e) => setProfileData({ ...profileData, location_state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageMin">Minimum Age</Label>
                <Input
                  id="ageMin"
                  type="number"
                  min="18"
                  max="99"
                  value={profileData.age_min}
                  onChange={(e) => setProfileData({ ...profileData, age_min: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="ageMax">Maximum Age</Label>
                <Input
                  id="ageMax"
                  type="number"
                  min="18"
                  max="99"
                  value={profileData.age_max}
                  onChange={(e) => setProfileData({ ...profileData, age_max: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Accommodation Availability Toggle */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border">
              <div>
                <Label htmlFor="accommodation" className="text-sm font-medium">
                  I have accommodation available
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Let others know if you can offer a place to stay
                </p>
              </div>
              <Switch
                id="accommodation"
                checked={profileData.has_accommodation_available}
                onCheckedChange={(checked) => 
                  setProfileData({ ...profileData, has_accommodation_available: checked })
                }
              />
            </div>

            {/* Available to Meet Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
              <div>
                <Label htmlFor="availableToMeet" className="text-sm font-medium">
                  I'm available to meet with travelers
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Let others know if you're open to meeting up or hanging out
                </p>
              </div>
              <Switch
                id="availableToMeet"
                checked={profileData.available_to_meet}
                onCheckedChange={(checked) => 
                  setProfileData({ ...profileData, available_to_meet: checked })
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Profile...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
