
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Users } from 'lucide-react';

const AdminPanel = () => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const makeUserAdmin = async () => {
    if (!newAdminEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // First, get the user ID from auth.users table using the email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail)
        .single();

      if (userError || !userData) {
        toast.error(`User not found with email: ${newAdminEmail}`);
        setIsLoading(false);
        return;
      }

      // Insert admin role for the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.id,
          role: 'admin'
        });

      if (roleError) {
        // Check if it's a duplicate key error (user already has admin role)
        if (roleError.code === '23505') {
          toast.success(`${newAdminEmail} is already an admin`);
        } else {
          toast.error(`Failed to make user admin: ${roleError.message}`);
        }
      } else {
        toast.success(`Successfully made ${newAdminEmail} an admin`);
        setNewAdminEmail('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error making user admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Admin Management
        </CardTitle>
        <CardDescription>
          Manage administrator accounts and permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Make User Admin</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Enter the email address of an existing user to grant them admin privileges.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={makeUserAdmin} 
              disabled={isLoading || !newAdminEmail}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isLoading ? 'Adding...' : 'Make Admin'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
