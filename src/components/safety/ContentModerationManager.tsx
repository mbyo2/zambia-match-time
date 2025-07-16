import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Flag, Eye, MessageSquare } from 'lucide-react';

interface Report {
  id: string;
  reason: string;
  description: string;
  content_type: string;
  status: string;
  created_at: string;
  reported_user: {
    first_name: string;
    id: string;
  };
}

const ContentModerationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserReports();
    }
  }, [user]);

  const fetchUserReports = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reported:profiles!reports_reported_id_fkey (
            id,
            first_name
          )
        `)
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      const formattedReports = data?.map(report => ({
        ...report,
        reported_user: report.reported
      })) || [];

      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUser || !reportReason) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: selectedUser,
          reason: reportReason,
          description: reportDescription,
          content_type: 'profile',
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Your report has been submitted for review. Thank you for helping keep our community safe.",
      });

      // Reset form
      setSelectedUser('');
      setReportReason('');
      setReportDescription('');
      
      // Refresh reports
      fetchUserReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const reportReasons = [
    'Inappropriate photos',
    'Fake profile',
    'Harassment',
    'Spam or scam',
    'Inappropriate messages',
    'Underage user',
    'Violence or threats',
    'Hate speech',
    'Other'
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <Shield className="h-12 w-12 text-blue-500 mx-auto" />
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-gray-600">
          Help us maintain a safe and respectful community
        </p>
      </div>

      {/* Report Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report a User
          </CardTitle>
          <CardDescription>
            If you encounter inappropriate behavior or content, please report it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitReport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Report Reason *
              </label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Details
              </label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide more details about the issue..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !reportReason}
              className="w-full"
            >
              {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Your Previous Reports
          </CardTitle>
          <CardDescription>
            Track the status of your submitted reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{report.reason}</span>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  
                  {report.description && (
                    <p className="text-sm text-gray-600">{report.description}</p>
                  )}
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Reported on {new Date(report.created_at).toLocaleDateString()}</span>
                    <span>Content type: {report.content_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Community Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✓ Encouraged</h4>
              <ul className="text-sm space-y-1">
                <li>• Authentic photos and information</li>
                <li>• Respectful communication</li>
                <li>• Honest about intentions</li>
                <li>• Report inappropriate behavior</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">✗ Not Allowed</h4>
              <ul className="text-sm space-y-1">
                <li>• Fake profiles or photos</li>
                <li>• Harassment or abuse</li>
                <li>• Inappropriate content</li>
                <li>• Spam or commercial activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentModerationManager;