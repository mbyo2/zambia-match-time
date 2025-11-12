
import React, { useState } from 'react';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EducationLevel = Database['public']['Enums']['education_level'];
type GenderType = Database['public']['Enums']['gender_type'];

const zambianProvinces = [
  'Central Province',
  'Copperbelt Province', 
  'Eastern Province',
  'Luapula Province',
  'Lusaka Province',
  'Muchinga Province',
  'Northern Province',
  'North-Western Province',
  'Southern Province',
  'Western Province'
];

const zambianCities = [
  'Lusaka', 'Ndola', 'Kitwe', 'Kabwe', 'Chingola', 'Mufulira', 'Luanshya',
  'Arusha', 'Kasama', 'Chipata', 'Livingstone', 'Mongu', 'Solwezi',
  'Mansa', 'Choma', 'Kapiri Mposhi', 'Mazabuka', 'Kafue'
];

const interests = [
  'Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Dancing',
  'Photography', 'Art', 'Movies', 'Fitness', 'Nature', 'Technology',
  'Fashion', 'Business', 'Education', 'Culture', 'Adventure'
];

const ProfileSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '', 
    gender: '' as GenderType,
    bio: '',
    occupation: '',
    education: '' as EducationLevel,
    location_city: '',
    location_state: '',
    interested_in: ['male', 'female'] as GenderType[],
    age_min: 18,
    age_max: 35,
    has_accommodation_available: false,
    selected_interests: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!profileData.first_name || !profileData.date_of_birth || !profileData.gender) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, birth date, gender)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          date_of_birth: profileData.date_of_birth,
          gender: profileData.gender,
          bio: profileData.bio,
          occupation: profileData.occupation,
          education: profileData.education || undefined,
          location_city: profileData.location_city,
          location_state: profileData.location_state,
          interested_in: profileData.interested_in,
          age_min: profileData.age_min,
          age_max: profileData.age_max,
          has_accommodation_available: profileData.has_accommodation_available,
          interests: profileData.selected_interests,
          search_preferences: {
            distance: 50,
            age_range: { min: profileData.age_min, max: profileData.age_max },
            interests: profileData.selected_interests,
            relationship_goals: ['serious']
          }
        });

      if (error) {
        logger.error('Profile creation error:', error);
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
        window.location.reload();
      }
    } catch (error) {
      logger.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = profileData.selected_interests;
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    setProfileData({ ...profileData, selected_interests: updated });
  };

  const toggleInterestedIn = (gender: GenderType) => {
    const current = profileData.interested_in;
    const updated = current.includes(gender)
      ? current.filter(g => g !== gender)
      : [...current, gender];
    setProfileData({ ...profileData, interested_in: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <CardDescription>Let's get you set up to meet amazing people in Zambia!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
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

            {/* Date of Birth and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={profileData.gender} onValueChange={(value: GenderType) => setProfileData({ ...profileData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                placeholder="Tell people about yourself..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
              />
            </div>

            {/* Occupation and Education */}
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

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Select value={profileData.location_city} onValueChange={(value) => setProfileData({ ...profileData, location_city: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {zambianCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state">Province</Label>
                <Select value={profileData.location_state} onValueChange={(value) => setProfileData({ ...profileData, location_state: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your province" />
                  </SelectTrigger>
                  <SelectContent>
                    {zambianProvinces.map(province => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Interests */}
            <div>
              <Label className="text-sm font-medium">Interests (Select up to 5)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {interests.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={profileData.selected_interests.includes(interest)}
                      onCheckedChange={() => toggleInterest(interest)}
                      disabled={profileData.selected_interests.length >= 5 && !profileData.selected_interests.includes(interest)}
                    />
                    <Label htmlFor={interest} className="text-sm">
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Interested In */}
            <div>
              <Label className="text-sm font-medium">Interested In</Label>
              <div className="flex gap-4 mt-2">
                {(['male', 'female', 'non_binary'] as GenderType[]).map((gender) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <Checkbox
                      id={`interested-${gender}`}
                      checked={profileData.interested_in.includes(gender)}
                      onCheckedChange={() => toggleInterestedIn(gender)}
                    />
                    <Label htmlFor={`interested-${gender}`} className="text-sm capitalize">
                      {gender === 'non_binary' ? 'Non-binary' : gender}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageMin">Minimum Age (18-99)</Label>
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
                <Label htmlFor="ageMax">Maximum Age (18-99)</Label>
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

            {/* Accommodation Toggle */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border">
              <div>
                <Label htmlFor="accommodation" className="text-sm font-medium">
                  I have accommodation available
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Let travelers know if you can offer a place to stay
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
