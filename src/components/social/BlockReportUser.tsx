
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield, Flag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockReportUserProps {
  userId: string;
  userName: string;
}

const BlockReportUser = ({ userId, userName }: BlockReportUserProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const reportReasons = [
    'inappropriate_photos',
    'harassment',
    'spam',
    'fake_profile',
    'inappropriate_messages',
    'underage',
    'other'
  ];

  const handleBlock = async () => {
    if (!user) return;
    
    setIsBlocking(true);
    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
          reason: 'Blocked by user'
        });

      if (error) throw error;

      toast({
        title: "User Blocked",
        description: `${userName} has been blocked successfully.`,
      });
      setBlockDialogOpen(false);
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReport = async () => {
    if (!user || !reportReason) return;
    
    setIsReporting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: userId,
          reason: reportReason,
          description: reportDescription
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe.",
      });
      setReportDialogOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Error reporting user:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Block User */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Shield size={16} className="mr-2" />
            Block
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {userName}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Blocking {userName} will prevent them from seeing your profile and contacting you. 
              You won't see their profile either.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBlock}
                disabled={isBlocking}
              >
                {isBlocking ? 'Blocking...' : 'Block User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report User */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Flag size={16} className="mr-2" />
            Report
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report {userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for reporting</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide more details about this report..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReport}
                disabled={isReporting || !reportReason}
              >
                {isReporting ? 'Reporting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlockReportUser;
