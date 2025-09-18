import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Camera, MapPin, User, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionBannerProps {
  onEditProfile: () => void;
}

const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ onEditProfile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completionData, setCompletionData] = useState({
    percentage: 0,
    missingFields: [] as string[],
    suggestions: [] as string[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    }
  }, [user]);

  const checkProfileCompletion = async () => {
    try {
      setLoading(true);
      
      // Check profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Check photos
      const { data: photos } = await supabase
        .from('profile_photos')
        .select('id')
        .eq('user_id', user?.id);

      if (!profile) return;

      const missingFields: string[] = [];
      const suggestions: string[] = [];
      let completedFields = 0;
      const totalFields = 12; // Adjust based on your requirements

      // Essential fields (required for good matching)
      if (!profile.bio || profile.bio.length < 50) {
        missingFields.push('bio');
        suggestions.push('Add a compelling bio (at least 50 characters)');
      } else {
        completedFields++;
      }

      if (!photos || photos.length === 0) {
        missingFields.push('photos');
        suggestions.push('Upload at least one profile photo');
      } else {
        completedFields++;
      }

      if (!profile.location_city || !profile.location_state) {
        missingFields.push('location');
        suggestions.push('Add your location for better matches');
      } else {
        completedFields++;
      }

      if (!profile.occupation) {
        missingFields.push('occupation');
        suggestions.push('Add your occupation');
      } else {
        completedFields++;
      }

      if (!profile.education) {
        missingFields.push('education');
        suggestions.push('Add your education level');
      } else {
        completedFields++;
      }

      if (!profile.interests || profile.interests.length < 3) {
        missingFields.push('interests');
        suggestions.push('Add at least 3 interests');
      } else {
        completedFields++;
      }

      if (!profile.relationship_goals || profile.relationship_goals.length === 0) {
        missingFields.push('relationship_goals');
        suggestions.push('Specify what you\'re looking for');
      } else {
        completedFields++;
      }

      if (!profile.height_cm) {
        missingFields.push('height');
        suggestions.push('Add your height');
      } else {
        completedFields++;
      }

      // Optional but recommended fields
      if (!profile.body_type) {
        completedFields += 0.5;
      } else {
        completedFields++;
      }

      if (!profile.ethnicity) {
        completedFields += 0.5;
      } else {
        completedFields++;
      }

      if (!profile.drinking) {
        completedFields += 0.5;
      } else {
        completedFields++;
      }

      if (!profile.smoking) {
        completedFields += 0.5;
      } else {
        completedFields++;
      }

      const percentage = Math.round((completedFields / totalFields) * 100);

      setCompletionData({
        percentage,
        missingFields,
        suggestions
      });

    } catch (error) {
      console.error('Error checking profile completion:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  // Don't show if profile is mostly complete
  if (completionData.percentage >= 80) return null;

  const getCompletionColor = () => {
    if (completionData.percentage >= 60) return 'text-green-600';
    if (completionData.percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionIcon = () => {
    if (completionData.percentage >= 60) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <Card className="mb-6 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getCompletionIcon()}
            <h3 className="font-semibold">Complete Your Profile</h3>
          </div>
          <span className={`text-sm font-medium ${getCompletionColor()}`}>
            {completionData.percentage}% Complete
          </span>
        </div>

        <Progress value={completionData.percentage} className="mb-4" />

        <div className="space-y-2 mb-4">
          {completionData.suggestions.slice(0, 3).map((suggestion, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
              {suggestion}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Complete profiles get 5x more matches!
          </p>
          <Button onClick={onEditProfile} size="sm">
            Complete Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionBanner;