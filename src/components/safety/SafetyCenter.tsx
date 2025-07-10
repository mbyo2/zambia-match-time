import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Heart, MessageSquare, Users } from 'lucide-react';

const SafetyCenter = () => {
  const safetyTips = [
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Trust Your Instincts",
      description: "If something feels off about a person or conversation, trust your gut and don't hesitate to unmatch or block them."
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Keep Conversations on the App",
      description: "Stay on JustGrown for initial conversations. Don't share personal contact information too quickly."
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Meet in Public Places",
      description: "Always meet new connections in public, well-lit areas. Tell a friend where you're going and when you'll be back."
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Take Your Time",
      description: "Don't feel pressured to meet someone immediately. Take time to get to know them through messages first."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Safety Center</h1>
        <p className="text-gray-600">Your safety is our priority. Learn how to stay safe while dating.</p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Safety First:</strong> JustGrown has built-in safety features including user verification, photo moderation, and a robust reporting system. However, your personal safety awareness is the most important protection.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safetyTips.map((tip, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {tip.icon}
                {tip.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {tip.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Red Flags to Watch For
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Asking for money or financial information</li>
            <li>• Refusing to video chat or talk on the phone</li>
            <li>• Pressuring you to meet immediately or in private</li>
            <li>• Photos that look too professional or model-like</li>
            <li>• Avoiding answering direct questions about themselves</li>
            <li>• Asking for personal information too quickly</li>
            <li>• Making you feel uncomfortable or unsafe</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Suspicious Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            If you encounter suspicious behavior, fake profiles, or inappropriate content, please report it immediately. 
            Our moderation team reviews all reports within 24 hours and takes appropriate action.
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm"><strong>Emergency:</strong> 911 (Zambia) / 999 (Zambia Police)</p>
          <p className="text-sm"><strong>Gender-Based Violence Hotline:</strong> 116</p>
          <p className="text-sm"><strong>Lifeline Zambia:</strong> +260 211 256 774</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyCenter;