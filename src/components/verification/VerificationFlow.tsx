import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Shield, Award, FileText } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

const VerificationFlow = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useFileUpload();
  const [verificationType, setVerificationType] = useState<'identity' | 'professional'>('identity');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [profession, setProfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selfieFile) return;

    setIsSubmitting(true);
    try {
      // Upload selfie
      const selfieUrl = await uploadFile(selfieFile, { bucket: 'profile-photos', folder: 'verification' });
      
      let documentUrl = null;
      if (verificationType === 'professional' && documentFile) {
        documentUrl = await uploadFile(documentFile, { bucket: 'profile-photos', folder: 'verification-documents' });
      }

      // Submit verification request
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          verification_type: verificationType,
          selfie_url: selfieUrl,
          professional_document_url: documentUrl,
          profession: verificationType === 'professional' ? profession : null,
        });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted for review.",
      });

      // Reset form
      setSelfieFile(null);
      setDocumentFile(null);
      setProfession('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <Shield className="h-12 w-12 text-blue-500 mx-auto" />
        <h1 className="text-2xl font-bold">Verify Your Profile</h1>
        <p className="text-gray-600">
          Increase your credibility and get more matches by verifying your identity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className={`cursor-pointer transition-colors ${
            verificationType === 'identity' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setVerificationType('identity')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Verify your identity with a selfie photo
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${
            verificationType === 'professional' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setVerificationType('professional')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Professional Verification
            </CardTitle>
            <CardDescription>
              Verify your profession with documents
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {verificationType === 'identity' ? 'Identity Verification' : 'Professional Verification'}
          </CardTitle>
          <CardDescription>
            {verificationType === 'identity' 
              ? 'Take a clear selfie photo to verify your identity'
              : 'Upload documents to verify your profession'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selfie Upload */}
            <div className="space-y-2">
              <Label htmlFor="selfie">Selfie Photo *</Label>
              <Input
                id="selfie"
                type="file"
                accept="image/*"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-gray-500">
                Take a clear photo of yourself looking directly at the camera
              </p>
            </div>

            {verificationType === 'professional' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Doctor, Lawyer, Engineer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Professional Document</Label>
                  <Input
                    id="document"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500">
                    Upload a professional license, certificate, or ID badge
                  </p>
                </div>
              </>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Verification Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Photos must be clear and well-lit</li>
                <li>• Face must be clearly visible (no sunglasses or masks)</li>
                <li>• No filters or heavy editing</li>
                <li>• Documents must be official and current</li>
                <li>• Verification typically takes 24-48 hours</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || isUploading || !selfieFile}
            >
              {isSubmitting || isUploading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationFlow;