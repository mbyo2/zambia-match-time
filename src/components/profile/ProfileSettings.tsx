import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield,
  CheckCircle,
  FileText,
  Moon,
  Sun,
  Building,
  Crown,
  Heart,
  BookOpen,
  LogOut,
} from 'lucide-react';

interface ProfileSettingsProps {
  isSuperAdmin: boolean;
  isLodgeManager: boolean;
  onNavigate: (tab: string) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  isSuperAdmin,
  isLodgeManager,
  onNavigate,
}) => {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const navItems = [
    { icon: Crown, iconColor: 'text-primary', title: 'Subscription', description: 'Manage your plan and premium features', tab: 'subscription' },
    { icon: Shield, iconColor: 'text-primary', title: 'Security Settings', description: 'Manage your account security', tab: 'security' },
    { icon: CheckCircle, iconColor: 'text-primary', title: 'Profile Verification', description: 'Verify your identity', tab: 'verification' },
    { icon: Shield, iconColor: 'text-primary', title: 'Content Moderation', description: 'Manage content settings', tab: 'moderation' },
    { icon: Heart, iconColor: 'text-primary', title: 'Safety Center', description: 'Safety resources and tools', tab: 'safety' },
    { icon: BookOpen, iconColor: 'text-muted-foreground', title: 'Community Guidelines', description: 'Our community standards', tab: 'guidelines' },
    { icon: FileText, iconColor: 'text-muted-foreground', title: 'Privacy Policy', description: 'Review our privacy policy', tab: 'privacy' },
    { icon: FileText, iconColor: 'text-muted-foreground', title: 'Terms of Service', description: 'Review our terms of service', tab: 'terms' },
  ];

  return (
    <div className="grid gap-4">
      {/* Dark Mode Toggle */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-4">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            <div>
              <h3 className="font-medium">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
            </div>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </CardContent>
      </Card>

      {/* Navigation cards */}
      {navItems.map((item) => (
        <Card
          key={item.tab}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => onNavigate(item.tab)}
        >
          <CardContent className="flex items-center gap-4 pt-6">
            <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {(isLodgeManager || isSuperAdmin) && (
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => onNavigate('manage-venues')}>
          <CardContent className="flex items-center gap-4 pt-6">
            <Building className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">Manage Venues</h3>
              <p className="text-sm text-muted-foreground">Add and manage lodge/guesthouse listings</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && (
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => onNavigate('admin')}>
          <CardContent className="flex items-center gap-4 pt-6">
            <Shield className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="font-medium">Developer Actions</h3>
              <p className="text-sm text-muted-foreground">Generate users and backfill photos</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => signOut()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
};

export default ProfileSettings;
