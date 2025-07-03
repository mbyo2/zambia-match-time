
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, FileText, Shield, CheckCircle } from 'lucide-react';

const VerificationFlow = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  
  const [verificationData, setVerificationData] = useState({
    verification_type: 'identity',
    selfie_file: null as File | null,
    document_file: null as File | null,
    profession: '',
    selfie_url: '',
    document_url: ''
  });

  const uploadFile = async (file: File, bucket: string) => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/verification/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSelfieUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setVerificationData(prev => ({ ...prev, selfie_file: file }));
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a document smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setVerificationData(prev => ({ ...prev, document_file: file }));
    }
  };

  const submitVerification = async () => {
    if (!user || !verificationData.selfie_file) {
      toast({
        title: "Missing information",
        description: "Please upload a selfie photo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload selfie
      const selfieUrl = await uploadFile(verificationData.selfie_file, 'profile-photos');
      if (!selfieUrl) {
        throw new Error('Failed to upload selfie');
      }

      let documentUrl = null;
      if (verificationData.document_file) {
        documentUrl = await uploadFile(verificationData.document_file, 'profile-photos');
        if (!documentUrl) {
          throw new Error('Failed to upload document');
        }
      }

      // Submit verification request
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          verification_type: verificationData.verification_type,
          selfie_url: selfieUrl,
          professional_document_url: documentUrl,
          profession: verificationData.profession || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Verification submitted!",
        description: "Your verification request has been submitted. We'll review it within 24-48 hours.",
      });

      setStep(4); // Success step
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Submission failed",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Get Verified</h2>
              <p className="text-gray-600">
                Verification helps build trust and keeps our community safe. 
                Verified users get a blue checkmark and priority in matches.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Camera className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Photo Verification</h3>
                  <p className="text-sm text-gray-600">Upload a clear selfie for identity verification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <FileText className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-semibold">Professional Verification (Optional)</h3>
                  <p className="text-sm text-gray-600">Verify your profession with work documents</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="verificationType">Verification Type</Label>
              <Select
                value={verificationData.verification_type}
                onValueChange={(value) => setVerificationData(prev => ({ ...prev, verification_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identity">Identity Verification</SelectItem>
                  <SelectItem value="professional">Professional Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              Start Verification
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Upload Selfie</h2>
            <p className="text-center text-gray-600">
              Take a clear selfie holding up your ID or just a clear face photo
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {verificationData.selfie_file ? (
                <div>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-semibold">Selfie uploaded!</p>
                  <p className="text-sm text-gray-500">{verificationData.selfie_file.name}</p>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload selfie</p>
                  <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!verificationData.selfie_file}
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">
              {verificationData.verification_type === 'professional' ? 'Professional Info' : 'Additional Info'}
            </h2>

            {verificationData.verification_type === 'professional' && (
              <>
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={verificationData.profession}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, profession: e.target.value }))}
                    placeholder="e.g., Doctor, Lawyer, Engineer"
                  />
                </div>

                <div>
                  <Label>Professional Document (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2">
                    {verificationData.document_file ? (
                      <div>
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-600 font-semibold">Document uploaded!</p>
                        <p className="text-sm text-gray-500">{verificationData.document_file.name}</p>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Upload work ID, license, or certificate</p>
                        <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleDocumentUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={submitVerification}
                disabled={uploading || (verificationData.verification_type === 'professional' && !verificationData.profession)}
                className="flex-1"
              >
                {uploading ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">Verification Submitted!</h2>
            <p className="text-gray-600">
              Thank you for submitting your verification. Our team will review your request 
              within 24-48 hours and notify you of the results.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>What happens next?</strong><br />
                • Our team reviews your submission<br />
                • You'll receive an email with the results<br />
                • Verified users get a blue checkmark on their profile
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i <= step ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  );
};

export default VerificationFlow;
