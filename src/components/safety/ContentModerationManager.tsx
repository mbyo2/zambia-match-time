import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Flag, CheckCircle, XCircle, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface UnverifiedPhoto {
  id: string;
  photo_url: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
  } | null;
}

const ContentModerationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [unverifiedPhotos, setUnverifiedPhotos] = useState<UnverifiedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchUnverifiedPhotos();
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
        content_type: (report.content_type || 'profile') as ContentReport['content_type'],
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

  const fetchUnverifiedPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_photos')
        .select('id, photo_url, created_at, profiles(id, first_name)')
        .or('is_verified.is.null,is_verified.eq.false')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUnverifiedPhotos(data || []);
    } catch (error) {
      console.error('Error fetching unverified photos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch photos for moderation.",
        variant: "destructive",
      });
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

  const moderatePhoto = async (photoId: string, userId: string, photoUrl: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('profile_photos')
          .update({ is_verified: true })
          .eq('id', photoId);

        if (error) throw error;
        toast({ title: "Photo Approved", description: "The photo is now visible." });
      } else if (action === 'reject') {
        // First, delete from storage
        const bucketName = 'profile-photos';
        // Extract file path from URL. e.g. /storage/v1/object/public/profile-photos/image.png -> image.png
        const filePath = photoUrl.substring(photoUrl.indexOf(bucketName) + bucketName.length + 1)
        
        if(filePath){
            const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);
            if (storageError) {
                console.error('Error deleting from storage, proceeding with DB deletion.', storageError);
            }
        }

        // Then, delete from database
        const { error: dbError } = await supabase
          .from('profile_photos')
          .delete()
          .eq('id', photoId);

        if (dbError) throw dbError;

        // Optionally, create a report against the user
        await reportContent(
          'profile',
          userId,
          'Inappropriate Photo',
          `An uploaded photo was rejected by moderators. The photo has been deleted.`
        );

        toast({ title: "Photo Rejected", description: "The photo has been removed and a report was filed.", variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error moderating photo:', error);
      toast({
        title: "Error",
        description: "Failed to moderate photo.",
        variant: "destructive",
      });
    } finally {
      fetchUnverifiedPhotos();
      fetchReports(); // In case a new report was created
      setIsLoading(false);
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
            Review and moderate user reports and photos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">User Reports</TabsTrigger>
              <TabsTrigger value="photos">Photo Moderation</TabsTrigger>
            </TabsList>
            <TabsContent value="reports" className="pt-4">
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
                        <span className="font-medium">User Report ({report.content_type})</span>
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
            </TabsContent>
            <TabsContent value="photos" className="pt-4">
                {unverifiedPhotos.length === 0 && (
                    <div className="text-center text-gray-500 py-10">
                        <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400"/>
                        <p>No new photos to review.</p>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unverifiedPhotos.map((photo) => (
                        <div key={photo.id} className="border rounded-lg p-2 space-y-2">
                            <img 
                                src={photo.photo_url} 
                                alt="Awaiting moderation" 
                                className="rounded-md aspect-square object-cover w-full"
                            />
                            <div className="text-sm">
                                <p>User: <span className="font-medium">{photo.profiles?.first_name || 'Unknown'}</span></p>
                                <p className="text-gray-500">
                                    Uploaded: {new Date(photo.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    className="w-full"
                                    variant="secondary"
                                    onClick={() => moderatePhoto(photo.id, photo.profiles!.id, photo.photo_url, 'approve')}
                                    disabled={isLoading}
                                >
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    variant="destructive"
                                    onClick={() => moderatePhoto(photo.id, photo.profiles!.id, photo.photo_url, 'reject')}
                                    disabled={isLoading}
                                >
                                    Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentModerationManager;
