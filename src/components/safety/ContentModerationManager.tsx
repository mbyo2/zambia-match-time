
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Flag, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentReport {
  id: string;
  content_type: 'profile' | 'photo' | 'message' | 'bio';
  content_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reported_user_id: string;
}

const ContentModerationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Use the reports table that exists in the database
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map the reports data to our ContentReport interface
      const mappedReports: ContentReport[] = (data || []).map(report => ({
        id: report.id,
        content_type: 'profile' as const,
        content_id: report.reported_id,
        reason: report.reason,
        description: report.description || '',
        status: report.status === 'pending' ? 'pending' : report.status === 'resolved' ? 'approved' : 'rejected',
        created_at: report.created_at || new Date().toISOString(),
        reported_user_id: report.reported_id
      }));
      
      setReports(mappedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const reportContent = async (
    contentType: ContentReport['content_type'],
    contentId: string,
    reason: string,
    description: string
  ) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Use the existing reports table structure
      const { error } = await supabase
        .from('reports')
        .insert({
          reason,
          description,
          reporter_id: user.id,
          reported_id: contentId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe.",
      });

      fetchReports();
    } catch (error) {
      console.error('Error reporting content:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const moderateContent = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const newStatus = action === 'approve' ? 'resolved' : 'rejected';
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Content Moderated",
        description: `Report has been ${action}d.`,
      });

      fetchReports();
    } catch (error) {
      console.error('Error moderating content:', error);
    }
  };

  const getStatusBadge = (status: ContentReport['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="destructive">Violation</Badge>;
      case 'rejected':
        return <Badge variant="default">Safe</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Content Moderation
          </CardTitle>
          <CardDescription>
            Review and moderate user reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {reports.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {reports.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600">Violations Found</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {reports.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600">Safe Content</div>
            </div>
          </div>

          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    <span className="font-medium">User Report</span>
                    {getStatusBadge(report.status)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Reason: </span>
                    {report.reason}
                  </div>
                  <div>
                    <span className="font-medium">Description: </span>
                    {report.description}
                  </div>
                </div>
                {report.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => moderateContent(report.id, 'approve')}
                    >
                      Mark as Violation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moderateContent(report.id, 'reject')}
                    >
                      Mark as Safe
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentModerationManager;
