
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Eye, UserX, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecuritySettings {
  two_factor_enabled: boolean;
  profile_visibility: 'public' | 'private' | 'friends_only';
  location_sharing: boolean;
  show_online_status: boolean;
  allow_message_requests: boolean;
  block_screenshots: boolean;
}

const SecuritySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    profile_visibility: 'public',
    location_sharing: true,
    show_online_status: true,
    allow_message_requests: true,
    block_screenshots: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    try {
      // In a real implementation, load from database
      console.log('Loading security settings for user:', user?.id);
      // For now, use default settings
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const updateSetting = async (key: keyof SecuritySettings, value: any) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // In a real implementation, save to database
      console.log('Updating security setting:', key, value);
      
      toast({
        title: "Settings Updated",
        description: "Your security settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating security setting:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive",
      });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async () => {
    try {
      // In a real implementation, this would set up 2FA
      toast({
        title: "2FA Setup",
        description: "Two-factor authentication setup would be implemented here.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up two-factor authentication",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Security & Privacy Settings</h1>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable 2FA</Label>
              <p className="text-sm text-gray-500">
                {settings.two_factor_enabled ? 'Two-factor authentication is enabled' : 'Secure your account with 2FA'}
              </p>
            </div>
            <Switch
              checked={settings.two_factor_enabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  enable2FA();
                } else {
                  updateSetting('two_factor_enabled', false);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control how others can see and interact with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Show Online Status</Label>
              <p className="text-sm text-gray-500">Let others see when you're online</p>
            </div>
            <Switch
              checked={settings.show_online_status}
              onCheckedChange={(checked) => updateSetting('show_online_status', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Location Sharing</Label>
              <p className="text-sm text-gray-500">Share your location for better matches</p>
            </div>
            <Switch
              checked={settings.location_sharing}
              onCheckedChange={(checked) => updateSetting('location_sharing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Allow Message Requests</Label>
              <p className="text-sm text-gray-500">Allow non-matches to send you messages</p>
            </div>
            <Switch
              checked={settings.allow_message_requests}
              onCheckedChange={(checked) => updateSetting('allow_message_requests', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Block Screenshots</Label>
              <p className="text-sm text-gray-500">Prevent others from taking screenshots of your profile</p>
            </div>
            <Switch
              checked={settings.block_screenshots}
              onCheckedChange={(checked) => updateSetting('block_screenshots', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Account Safety
          </CardTitle>
          <CardDescription>
            Tools to help keep you safe on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <UserX className="mr-2 h-4 w-4" />
            View Blocked Users
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Shield className="mr-2 h-4 w-4" />
            Safety Center
          </Button>
          <Button variant="destructive" className="w-full">
            Deactivate Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
