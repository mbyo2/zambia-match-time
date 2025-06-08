
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationRequest {
  id: string;
  user_id: string;
  selfie_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
}

const VerificationManager = () => {
  const { user } = useAuth();
  const { uploadFile, isUploading } = useFileUpload();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);

  useEffect(() => {
    if (user) {
      checkVerificationStatus();
      fetchVerificationRequests();
    }
  }, [user]);

  const checkVerificationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setVerificationStatus(data[0].status as any);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
    }
  };

  const handleSelfieUpload = async (file: File) => {
    if (!user) return;

    try {
      const fileName = `verification/${user.id}/${Date.now()}-${file.name}`;
      const fileUrl = await uploadFile(file, 'profile-photos', fileName);

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          selfie_url: fileUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted for review.",
      });

      setVerificationStatus('pending');
      fetchVerificationRequests();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification request",
        variant: "destructive",
      });
    }
  };

  const reviewVerification = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update profile verification status
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('profiles')
            .update({
              is_verified: true,
              verification_status: 'approved'
            })
            .eq('id', request.user_id);
        }
      }

      toast({
        title: "Verification Reviewed",
        description: `Verification request has been ${status}.`,
      });

      fetchVerificationRequests();
    } catch (error) {
      console.error('Error reviewing verification:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Verification
          </CardTitle>
          <CardDescription>
            Verify your identity to build trust and get a verification badge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium">Verification Status</h3>
              <p className="text-sm text-gray-600">
                {verificationStatus === 'none' && 'Not verified yet'}
                {verificationStatus === 'pending' && 'Verification under review'}
                {verificationStatus === 'approved' && 'Profile verified!'}
                {verificationStatus === 'rejected' && 'Verification rejected'}
              </p>
            </div>
            {getStatusBadge(verificationStatus)}
          </div>

          {verificationStatus === 'none' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Take a Verification Selfie</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Take a clear selfie holding a piece of paper with your username written on it
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSelfieUpload(file);
                  }}
                  className="hidden"
                  id="verification-selfie"
                />
                <label htmlFor="verification-selfie">
                  <Button disabled={isUploading} asChild>
                    <span>
                      {isUploading ? 'Uploading...' : 'Take Selfie'}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Verification in Progress</h3>
              <p className="text-sm text-gray-600">
                Your verification request is being reviewed. This usually takes 24-48 hours.
              </p>
            </div>
          )}

          {verificationStatus === 'approved' && (
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Profile Verified!</h3>
              <p className="text-sm text-gray-600">
                Your profile is now verified and will display a verification badge.
              </p>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Verification Rejected</h3>
              <p className="text-sm text-gray-600">
                Your verification request was rejected. Please try again with a clearer photo.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setVerificationStatus('none')}
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin section for reviewing requests */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests (Admin)</CardTitle>
          <CardDescription>
            Review and approve verification requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.filter(r => r.status === 'pending').map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">Verification Request</h3>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="mb-4">
                  <img 
                    src={request.selfie_url} 
                    alt="Verification selfie"
                    className="max-w-xs rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => reviewVerification(request.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => reviewVerification(request.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationManager;
