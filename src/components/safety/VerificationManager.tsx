import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Shield, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VerificationRequest {
  id: string;
  user_id: string;
  selfie_url: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  verification_type: string;
  profession: string | null;
  professional_document_url: string | null;
}

const VerificationManager = () => {
  const { user } = useAuth();
  const { uploadFile, isUploading } = useFileUpload();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [verificationType, setVerificationType] = useState<'identity' | 'professional'>('identity');
  const [profession, setProfession] = useState('');
  const [professionalDocument, setProfessionalDocument] = useState<File | null>(null);

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

  const handleVerificationSubmit = async (selfieFile: File) => {
    if (!user) return;

    if (verificationType === 'professional' && (!profession || !professionalDocument)) {
      toast({
        title: "Missing Information",
        description: "Please provide your profession and upload a document.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selfieUrl = await uploadFile(selfieFile, {
        bucket: 'verification-selfies',
        folder: `${user.id}/selfies`,
        maxSizeKB: 10240, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });
      if (!selfieUrl) return;

      let professionalDocumentUrl: string | null = null;
      if (verificationType === 'professional' && professionalDocument) {
        professionalDocumentUrl = await uploadFile(professionalDocument, {
          bucket: 'verification-selfies',
          folder: `${user.id}/documents`,
          maxSizeKB: 10240, // 10MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        });
        if (!professionalDocumentUrl) return;
      }

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          selfie_url: selfieUrl,
          status: 'pending',
          verification_type: verificationType,
          profession: verificationType === 'professional' ? profession : null,
          professional_document_url: professionalDocumentUrl,
        });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted for review.",
      });

      setVerificationStatus('pending');
      fetchVerificationRequests();
      setProfession('');
      setProfessionalDocument(null);
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification request",
        variant: "destructive",
      });
    }
  };

  const reviewVerification = async (requestId: string, status: 'verified' | 'rejected') => {
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
      if (status === 'verified') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const profileUpdate: {
            is_verified: boolean;
            verification_status: 'verified' | 'rejected';
            professional_badge?: string;
          } = {
            is_verified: true,
            verification_status: 'verified',
          };
          
          if (request.verification_type === 'professional' && request.profession) {
            profileUpdate.professional_badge = request.profession;
          }

          await supabase
            .from('profiles')
            .update(profileUpdate)
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
      case 'verified':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  const renderVerificationForm = () => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="font-medium mb-2">Take a Verification Selfie</h3>
      <p className="text-sm text-gray-600 mb-4">
        Take a clear selfie holding a piece of paper with your username written on it.
      </p>
      <input
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleVerificationSubmit(file);
        }}
        className="hidden"
        id="verification-selfie"
      />
      <label htmlFor="verification-selfie">
        <Button disabled={isUploading} asChild>
          <span>
            {isUploading ? 'Uploading...' : 'Take Selfie & Submit'}
          </span>
        </Button>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Verification
          </CardTitle>
          <CardDescription>
            Verify your identity to build trust and get a verification badge. Professionals can get a special badge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium">Verification Status</h3>
              <p className="text-sm text-gray-600">
                {verificationStatus === 'none' && 'Not verified yet'}
                {verificationStatus === 'pending' && 'Verification under review'}
                {verificationStatus === 'verified' && 'Profile verified!'}
                {verificationStatus === 'rejected' && 'Verification rejected'}
              </p>
            </div>
            {getStatusBadge(verificationStatus)}
          </div>

          {verificationStatus === 'none' && (
            <Tabs value={verificationType} onValueChange={(value) => setVerificationType(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
              </TabsList>
              <TabsContent value="identity" className="pt-4">
                <p className="text-sm text-center text-gray-600 mb-4">Verify your identity to get a standard verified badge.</p>
                {renderVerificationForm()}
              </TabsContent>
              <TabsContent value="professional" className="pt-4 space-y-4">
                <p className="text-sm text-center text-gray-600">Verify your professional status (e.g., Doctor, Teacher) for a special badge.</p>
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Input 
                    id="profession" 
                    placeholder="e.g., Doctor, Teacher" 
                    value={profession} 
                    onChange={(e) => setProfession(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="professional-document">Proof of Profession</Label>
                   <Input
                    id="professional-document"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProfessionalDocument(e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a document, ID, or certificate.</p>
                </div>
                {renderVerificationForm()}
              </TabsContent>
            </Tabs>
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

          {verificationStatus === 'verified' && (
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
            {requests.length === 0 && <p className="text-sm text-gray-500">No pending requests.</p>}
            {requests.filter(r => r.status === 'pending').map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">
                      {request.verification_type === 'professional' ? 'Professional' : 'Identity'} Verification
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-1">Selfie:</h4>
                  <a href={request.selfie_url} target="_blank" rel="noreferrer noopener">
                    <img 
                      src={request.selfie_url} 
                      alt="Verification selfie"
                      className="max-w-xs rounded-lg border"
                    />
                  </a>
                </div>

                {request.verification_type === 'professional' && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium text-sm">Profession:</h4>
                      <p className="text-sm">{request.profession || 'N/A'}</p>
                    </div>
                    {request.professional_document_url && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-1">Professional Document:</h4>
                        <a href={request.professional_document_url} target="_blank" rel="noreferrer noopener" className="text-pink-600 hover:underline flex items-center gap-2">
                           <FileText size={16}/> View Document
                        </a>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => reviewVerification(request.id, 'verified')}
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
