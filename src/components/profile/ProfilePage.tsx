
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import UserStatsDisplay from '@/components/gamification/UserStatsDisplay';
import DailyRewardModal from '@/components/gamification/DailyRewardModal';
import IcebreakerPromptsSection from '@/components/prompts/IcebreakerPromptsSection';
import PhotoUploadSection from './PhotoUploadSection';
import { 
  User, 
  Edit, 
  Settings, 
  Shield, 
  CheckCircle, 
  FileText, 
  Gift,
  Trophy,
  MessageCircle
} from 'lucide-react';

interface ProfilePageProps {
  setCurrentTab: (tab: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const { todayReward } = useDailyRewards();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);

  const handlePhotosUpdate = () => {
    // Refresh photos logic
    console.log('Photos updated');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex gap-2">
          {todayReward && !todayReward.claimed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRewardModal(true)}
              className="animate-pulse"
            >
              <Gift className="mr-2 h-4 w-4" />
              Daily Reward!
            </Button>
          )}
          <Button onClick={() => setCurrentTab('profile-edit')}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">
            <Trophy className="mr-2 h-4 w-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <MessageCircle className="mr-2 h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setCurrentTab('profile-edit')}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile Details
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setCurrentTab('verification')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setCurrentTab('security')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          <PhotoUploadSection 
            photos={photos} 
            onPhotosUpdate={handlePhotosUpdate} 
          />
        </TabsContent>

        <TabsContent value="stats">
          <UserStatsDisplay />
        </TabsContent>

        <TabsContent value="prompts">
          <IcebreakerPromptsSection />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4">
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setCurrentTab('security')}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">Security Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your account security</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setCurrentTab('verification')}>
              <CardContent className="flex items-center gap-4 pt-6">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-medium">Profile Verification</h3>
                  <p className="text-sm text-muted-foreground">Verify your identity</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setCurrentTab('moderation')}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Shield className="h-5 w-5 text-purple-500" />
                <div>
                  <h3 className="font-medium">Content Moderation</h3>
                  <p className="text-sm text-muted-foreground">Manage content settings</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setCurrentTab('privacy')}>
              <CardContent className="flex items-center gap-4 pt-6">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">Review our privacy policy</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setCurrentTab('terms')}>
              <CardContent className="flex items-center gap-4 pt-6">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground">Review our terms of service</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <DailyRewardModal 
        open={showRewardModal} 
        onOpenChange={setShowRewardModal} 
      />
    </div>
  );
};

export default ProfilePage;
