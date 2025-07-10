import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Heart, Shield, AlertTriangle } from 'lucide-react';

const CommunityGuidelines = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-gray-600">Help us maintain a safe, respectful, and authentic community for everyone.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Be Authentic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• Use real, recent photos of yourself</p>
          <p>• Be honest about your age, location, and intentions</p>
          <p>• Don't impersonate someone else or use fake information</p>
          <p>• Only create one account</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Be Respectful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• Treat everyone with kindness and respect</p>
          <p>• Don't send unsolicited explicit content</p>
          <p>• Respect when someone says no or doesn't respond</p>
          <p>• Don't harass, bully, or threaten other users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Stay Safe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• Don't share personal information too quickly</p>
          <p>• Meet in public places for first dates</p>
          <p>• Report suspicious or inappropriate behavior</p>
          <p>• Trust your instincts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Prohibited Content & Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Absolutely Not Allowed:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Nudity or sexually explicit content</li>
              <li>• Hate speech, discrimination, or harassment</li>
              <li>• Violence, threats, or illegal activities</li>
              <li>• Spam, scams, or solicitation</li>
              <li>• Minors (must be 18+ to use JustGrown)</li>
              <li>• Prostitution or escort services</li>
              <li>• Drug-related content</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consequences</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Violating these guidelines may result in:
          </CardDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Warning or temporary restrictions</li>
            <li>• Content removal</li>
            <li>• Account suspension or permanent ban</li>
            <li>• Reporting to law enforcement (for illegal activities)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reporting Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Help us keep JustGrown safe by reporting violations. You can report users or content directly from their profile or messages. 
            All reports are reviewed by our moderation team within 24 hours.
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions?</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            If you have questions about these guidelines or need help with your account, contact our support team at support@justgrown.com.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityGuidelines;