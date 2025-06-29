
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Shield, FileText, CheckCircle } from 'lucide-react';
import DevActions from '../admin/DevActions';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfilePageProps {
  setCurrentTab: (tab: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentTab }) => {
  const { user } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ['userRole', user?.id, 'admin'],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        p_user_id: user.id,
        p_role: 'admin',
      });
      if (error) {
        console.error('Error checking admin role:', error.message);
        return false;
      }
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
          <div className="space-y-3">
            <Button 
              onClick={() => setCurrentTab('profile-edit')}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              Edit Profile
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setCurrentTab('verification')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Get Verified
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setCurrentTab('security')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Security & Privacy
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setCurrentTab('moderation')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Content Moderation
            </Button>
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Legal</h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full text-sm"
                  onClick={() => setCurrentTab('privacy')}
                >
                  <FileText className="mr-2 h-3 w-3" />
                  Privacy Policy
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full text-sm"
                  onClick={() => setCurrentTab('terms')}
                >
                  <FileText className="mr-2 h-3 w-3" />
                  Terms of Service
                </Button>
              </div>
            </div>
          </div>
        </div>
        {isAdmin && <DevActions />}
      </div>
    </div>
  );
};

export default ProfilePage;
