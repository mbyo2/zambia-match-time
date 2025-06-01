
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ProfileSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    occupation: '',
    education: '',
    locationCity: '',
    locationState: '',
    maxDistance: 50,
    ageMin: 18,
    ageMax: 99,
    heightCm: '',
    interestedIn: ['male', 'female'] as string[],
    relationshipGoals: ['casual'] as string[],
    interests: [] as string[],
  });

  const handleInterestedInChange = (value: string, checked: boolean) => {
    if (checked) {
      setProfileData({
        ...profileData,
        interestedIn: [...profileData.interestedIn, value]
      });
    } else {
      setProfileData({
        ...profileData,
        interestedIn: profileData.interestedIn.filter(item => item !== value)
      });
    }
  };

  const handleRelationshipGoalsChange = (value: string, checked: boolean) => {
    if (checked) {
      setProfileData({
        ...profileData,
        relationshipGoals: [...profileData.relationshipGoals, value]
      });
    } else {
      setProfileData({
        ...profileData,
        relationshipGoals: profileData.relationshipGoals.filter(item => item !== value)
      });
    }
  };

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
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          date_of_birth: user.user_metadata.date_of_birth,
          gender: user.user_metadata.gender,
          interested_in: profileData.interestedIn,
          bio: profileData.bio,
          occupation: profileData.occupation,
          education: profileData.education as any,
          location_city: profileData.locationCity,
          location_state: profileData.locationState,
          max_distance: profileData.maxDistance,
          age_min: profileData.ageMin,
          age_max: profileData.ageMax,
          height_cm: profileData.heightCm ? parseInt(profileData.heightCm) : null,
          relationship_goals: profileData.relationshipGoals,
          interests: profileData.interests,
        });

      if (error) {
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
      }
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Select value={profileData.education} onValueChange={(value) => setProfileData({ ...profileData, education: value })}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="locationCity">City</Label>
                  <Input
                    id="locationCity"
                    value={profileData.locationCity}
                    onChange={(e) => setProfileData({ ...profileData, locationCity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="locationState">State</Label>
                  <Input
                    id="locationState"
                    value={profileData.locationState}
                    onChange={(e) => setProfileData({ ...profileData, locationState: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Interested In</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {['male', 'female', 'non_binary', 'other'].map((gender) => (
                    <div key={gender} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interested-${gender}`}
                        checked={profileData.interestedIn.includes(gender)}
                        onCheckedChange={(checked) => handleInterestedInChange(gender, checked as boolean)}
                      />
                      <Label htmlFor={`interested-${gender}`} className="capitalize">
                        {gender.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Relationship Goals</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {['casual', 'serious', 'friendship', 'networking'].map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={profileData.relationshipGoals.includes(goal)}
                        onCheckedChange={(checked) => handleRelationshipGoalsChange(goal, checked as boolean)}
                      />
                      <Label htmlFor={`goal-${goal}`} className="capitalize">
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Profile...' : 'Complete Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
