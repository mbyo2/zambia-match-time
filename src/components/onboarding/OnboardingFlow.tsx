
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Camera, User, Heart, Shield } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to MatchTime!',
      description: 'Find meaningful connections and lasting relationships',
      icon: <Heart className="h-8 w-8 text-pink-500" />,
      component: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">💖</div>
          <h2 className="text-2xl font-bold text-gray-800">Ready to find love?</h2>
          <p className="text-gray-600">
            MatchTime helps you discover compatible people in your area. 
            Let's set up your profile to get started!
          </p>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Create Your Profile',
      description: 'Tell us about yourself to find better matches',
      icon: <User className="h-8 w-8 text-blue-500" />,
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your profile is your first impression</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Be Authentic</h4>
              <p className="text-sm text-gray-600">
                Share genuine information about yourself, your interests, and what you're looking for.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">Add Photos</h4>
              <p className="text-sm text-gray-600">
                Upload clear, recent photos that show your personality and lifestyle.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'photos',
      title: 'Add Your Photos',
      description: 'Photos help others get to know you better',
      icon: <Camera className="h-8 w-8 text-purple-500" />,
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Photo Tips</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium">Use clear, high-quality images</p>
                <p className="text-sm text-gray-600">Make sure your face is clearly visible</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium">Show your personality</p>
                <p className="text-sm text-gray-600">Include photos of your hobbies and interests</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium">Recent photos only</p>
                <p className="text-sm text-gray-600">Use photos taken within the last year</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'safety',
      title: 'Stay Safe',
      description: 'Your safety and privacy are our top priorities',
      icon: <Shield className="h-8 w-8 text-green-500" />,
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Safety Guidelines</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm">
                <strong>Meet in public:</strong> Always meet new people in public places for first dates.
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <strong>Trust your instincts:</strong> If something feels off, don't hesitate to block or report.
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm">
                <strong>Keep personal info private:</strong> Don't share sensitive information too quickly.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStepData.component}
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button 
              onClick={handleNext}
              className="bg-pink-500 hover:bg-pink-600"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
