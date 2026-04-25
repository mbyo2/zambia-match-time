import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Edit, CheckCircle, Shield, Eye } from 'lucide-react';
import PhotoUploadSection from './PhotoUploadSection';
import ProfileCompletionBanner from './ProfileCompletionBanner';

interface ProfileOverviewProps {
  user: { email?: string } | null;
  profile: any;
  photos: any[];
  onPhotosUpdate: () => void;
  onNavigate: (tab: string) => void;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  user,
  profile,
  photos,
  onPhotosUpdate,
  onNavigate,
}) => {
  return (
    <div className="space-y-4">
      <ProfileCompletionBanner onEditProfile={() => onNavigate('profile-edit')} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {profile && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{profile.location_city}, {profile.location_state}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <p className="font-medium">{profile.bio || 'No bio added yet'}</p>
                  </div>
                </>
              )}
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
              onClick={() => onNavigate('profile-edit')}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile Details
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('verification')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Profile
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('profile-views')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Who Viewed Me
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('security')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <PhotoUploadSection
        photos={photos}
        onPhotosUpdate={onPhotosUpdate}
      />
    </div>
  );
};

export default ProfileOverview;
