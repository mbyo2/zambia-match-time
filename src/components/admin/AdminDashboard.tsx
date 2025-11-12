import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AppStats {
  total_users: number;
  real_users: number;
  fake_users: number;
  total_matches: number;
  total_messages: number;
  active_users_7d: number;
  users_with_photos: number;
  total_swipes: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_app_statistics');
      if (error) throw error;
      setStats(data as unknown as AppStats);
    } catch (error) {
      // Silently fail in production, log in development
    }
  };

  const cleanupFakeUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_fake_users');
      if (error) throw error;
      
      toast.success(`Successfully deleted ${data} fake users`);
      await loadStats();
    } catch (error: any) {
      toast.error('Failed to cleanup fake users: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <Button onClick={loadStats} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      {stats?.fake_users > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            There are {stats.fake_users} test users in the system. Consider cleaning them up before going live.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.real_users || 0} real, {stats?.fake_users || 0} test
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_users_7d || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_matches || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successful connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_messages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total conversations
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>How users are interacting with the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Users with Photos</span>
              <span className="font-medium">{stats?.users_with_photos || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Swipes</span>
              <span className="font-medium">{stats?.total_swipes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Photo Completion Rate</span>
              <span className="font-medium">
                {stats?.total_users && stats.users_with_photos 
                  ? Math.round((stats.users_with_photos / stats.total_users) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Data Management
            </CardTitle>
            <CardDescription>Clean up test data for production</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remove all test users with @matchtime.com emails. This action cannot be undone.
              </p>
              <Button 
                onClick={cleanupFakeUsers} 
                variant="destructive"
                disabled={isLoading || !stats?.fake_users}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Cleaning...' : `Delete ${stats?.fake_users || 0} Test Users`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;