import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, FileText, MapPin, Heart, Check } from 'lucide-react';

interface ProfileCompletionGuideProps {
  profileData: any;
  onActionClick: (action: string) => void;
}

const ProfileCompletionGuide: React.FC<ProfileCompletionGuideProps> = ({ 
  profileData, 
  onActionClick 
}) => {
  const completionItems = [
    {
      id: 'photos',
      title: 'Add Photos',
      description: 'Upload at least 3 photos',
      icon: <Camera className="h-5 w-5" />,
      completed: profileData?.photo_count >= 3,
      progress: Math.min((profileData?.photo_count || 0) / 3 * 100, 100),
      action: 'upload-photos'
    },
    {
      id: 'bio',
      title: 'Write Bio',
      description: 'Tell others about yourself',
      icon: <FileText className="h-5 w-5" />,
      completed: profileData?.bio && profileData.bio.length > 50,
      progress: profileData?.bio ? Math.min(profileData.bio.length / 50 * 100, 100) : 0,
      action: 'edit-bio'
    },
    {
      id: 'location',
      title: 'Set Location',
      description: 'Add your city and province',
      icon: <MapPin className="h-5 w-5" />,
      completed: profileData?.location_city && profileData?.location_state,
      progress: (profileData?.location_city && profileData?.location_state) ? 100 : 0,
      action: 'edit-location'
    },
    {
      id: 'preferences',
      title: 'Dating Preferences',
      description: 'Set your age range and interests',
      icon: <Heart className="h-5 w-5" />,
      completed: profileData?.interests && profileData.interests.length > 0,
      progress: profileData?.interests ? Math.min(profileData.interests.length / 3 * 100, 100) : 0,
      action: 'edit-preferences'
    }
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const overallProgress = (completedCount / completionItems.length) * 100;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Complete Your Profile
          <span className="text-sm font-normal">{completedCount}/4</span>
        </CardTitle>
        <CardDescription>
          Complete your profile to get better matches and increase visibility
        </CardDescription>
        <Progress value={overallProgress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {completionItems.map((item) => (
            <div 
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  item.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {item.completed ? <Check className="h-4 w-4" /> : item.icon}
                </div>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  {!item.completed && item.progress > 0 && (
                    <Progress value={item.progress} className="w-32 h-1 mt-1" />
                  )}
                </div>
              </div>
              {!item.completed && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onActionClick(item.action)}
                >
                  {item.progress > 0 ? 'Continue' : 'Start'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionGuide;