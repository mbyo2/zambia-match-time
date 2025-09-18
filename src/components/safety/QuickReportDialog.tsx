import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickReportDialogProps {
  reportedUserId: string;
  reportedUserName: string;
  contentType?: 'profile' | 'message' | 'photo';
  contentId?: string;
  trigger?: React.ReactNode;
}

const QuickReportDialog: React.FC<QuickReportDialogProps> = ({
  reportedUserId,
  reportedUserName,
  contentType = 'profile',
  contentId,
  trigger
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'fake_profile', label: 'Fake profile or photos' },
    { value: 'spam', label: 'Spam or promotional content' },
    { value: 'underage', label: 'Appears to be underage' },
    { value: 'offensive_language', label: 'Offensive language' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: reportedUserId,
          reason: selectedReason,
          description: description.trim() || null,
          content_type: contentType,
          content_metadata: contentId ? { content_id: contentId } : null,
          status: 'pending'
        });

      if (error) throw error;

      // Also block the user automatically for safety
      await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: reportedUserId,
          reason: `Reported for: ${selectedReason}`
        });

      toast({
        title: "Report Submitted",
        description: `Thank you for reporting. We'll review this ${contentType} and take appropriate action. The user has been blocked.`,
      });

      setIsOpen(false);
      setSelectedReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
      <Flag className="w-4 h-4" />
      Report
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Report {reportedUserName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Help us keep the community safe. Your report will be reviewed by our moderation team.
          </p>

          <div className="space-y-3">
            <Label>What's the issue?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reportReasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="text-sm font-normal">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context that might help our review..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Reporting will also block this user from contacting you. 
              False reports may result in account restrictions.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickReportDialog;