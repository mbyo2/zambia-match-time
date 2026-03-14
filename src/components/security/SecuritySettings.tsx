
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Eye, UserX, AlertTriangle, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logger } from '@/utils/logger';

interface SecuritySettingsState {
  show_online_status: boolean;
  location_sharing: boolean;
  allow_message_requests: boolean;
  block_screenshots: boolean;
}

interface BlockedUser {
  id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  profile?: { first_name: string };
}

const SecuritySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettingsState>({
    show_online_status: true,
    location_sharing: true,
    allow_message_requests: true,
    block_screenshots: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', user.id)
        .single();

      if (!error && data?.privacy_settings) {
        const ps = data.privacy_settings as Record<string, boolean>;
        setSettings({
          show_online_status: ps.show_online_status ?? true,
          location_sharing: ps.location_sharing ?? true,
          allow_message_requests: ps.allow_message_requests ?? true,
          block_screenshots: ps.block_screenshots ?? false,
        });
      }
    } catch (error) {
      logger.error('Error loading security settings:', error);
    }
  };

  const updateSetting = async (key: keyof SecuritySettingsState, value: boolean) => {
    if (!user) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: newSettings })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: "Settings Updated", description: "Your privacy settings have been saved." });
    } catch (error) {
      // Revert on failure
      setSettings(settings);
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters long", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password Updated", description: "Your password has been updated successfully." });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!user) return;
    setLoadingBlocked(true);
    try {
      const { data: blocks, error } = await supabase
        .from('user_blocks')
        .select('id, blocked_id, reason, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (blocks && blocks.length > 0) {
        const blockedIds = blocks.map(b => b.blocked_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name')
          .in('id', blockedIds);

        const enriched = blocks.map(b => ({
          ...b,
          profile: profiles?.find(p => p.id === b.blocked_id),
        }));
        setBlockedUsers(enriched);
      } else {
        setBlockedUsers([]);
      }
    } catch (error) {
      logger.error('Error fetching blocked users:', error);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const unblockUser = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
      toast({ title: "User Unblocked", description: "The user has been unblocked." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to unblock user", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Security & Privacy Settings</h1>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control how others can see and interact with you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {([
            { key: 'show_online_status' as const, label: 'Show Online Status', desc: "Let others see when you're online" },
            { key: 'location_sharing' as const, label: 'Location Sharing', desc: 'Share your location for better matches' },
            { key: 'allow_message_requests' as const, label: 'Allow Message Requests', desc: 'Allow non-matches to send you messages' },
            { key: 'block_screenshots' as const, label: 'Block Screenshots', desc: 'Prevent others from taking screenshots of your profile' },
          ]).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">{label}</Label>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={settings[key]} onCheckedChange={(checked) => updateSetting(key, checked)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Account Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Account Safety
          </CardTitle>
          <CardDescription>Tools to help keep you safe on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setShowBlockedUsers(true);
              fetchBlockedUsers();
            }}
          >
            <UserX className="mr-2 h-4 w-4" />
            View Blocked Users
          </Button>
        </CardContent>
      </Card>

      {/* Blocked Users Dialog */}
      <Dialog open={showBlockedUsers} onOpenChange={setShowBlockedUsers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Blocked Users
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {loadingBlocked ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : blockedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No blocked users</p>
              </div>
            ) : (
              blockedUsers.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">
                      {block.profile?.first_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Blocked {new Date(block.created_at).toLocaleDateString()}
                      {block.reason && ` · ${block.reason}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockUser(block.id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, profile, matches, messages, and all data. This action cannot be undone.
                  <br /><br />
                  Type <strong>DELETE</strong> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE to confirm" />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const response = await supabase.functions.invoke('delete-account', {
                        headers: { Authorization: `Bearer ${session?.access_token}` },
                      });
                      if (response.error) throw response.error;
                      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
                      await supabase.auth.signOut();
                    } catch (error: any) {
                      toast({ title: "Error", description: error.message || "Failed to delete account", variant: "destructive" });
                    } finally {
                      setIsDeleting(false);
                      setDeleteConfirmText('');
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
