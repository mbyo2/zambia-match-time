
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Users, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      // Use the make_user_admin function
      const { error } = await supabase.rpc('make_user_admin', {
        user_email: newAdminEmail
      });

      if (error) {
        toast.error(`Failed to make user admin: ${error.message}`);
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
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Default Admin Account:</strong><br />
            Email: <code className="bg-gray-100 px-1 rounded">admin@justgrown.com</code><br />
            Password: <code className="bg-gray-100 px-1 rounded">AdminPass123!</code><br />
            <span className="text-sm text-muted-foreground">
              You need to sign up with these credentials first, then this account will automatically have admin privileges.
            </span>
          </AlertDescription>
        </Alert>
        
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
