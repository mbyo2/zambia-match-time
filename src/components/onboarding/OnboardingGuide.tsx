import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Heart, MessageCircle, Settings, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: () => void;
}

interface OnboardingGuideProps {
  onComplete?: () => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add photos and tell us about yourself to get better matches',
      icon: <Settings className="h-5 w-5" />,
      completed: false,
    },
    {
      id: 'photos',
      title: 'Upload Photos',
      description: 'Add at least 3 photos to increase your match rate by 80%',
      icon: <Camera className="h-5 w-5" />,
      completed: false,
    },
    {
      id: 'discover',
      title: 'Start Swiping',
      description: 'Browse profiles and start making connections',
      icon: <Heart className="h-5 w-5" />,
      completed: false,
    },
    {
      id: 'chat',
      title: 'Send Messages',
      description: 'When you match, start a conversation to build connections',
      icon: <MessageCircle className="h-5 w-5" />,
      completed: false,
    },
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    if (steps[stepIndex].action) {
      steps[stepIndex].action!();
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Welcome to JustGrown!
        </CardTitle>
        <CardDescription>
          Let's get you set up for success. Complete these steps to maximize your experience.
        </CardDescription>
        <Progress value={progress} className="mt-4" />
        <p className="text-sm text-muted-foreground">
          {completedSteps} of {steps.length} steps completed
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                step.completed
                  ? 'bg-green-50 border-green-200'
                  : currentStep === index
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => handleStepClick(index)}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step.completed ? <Check className="h-4 w-4" /> : step.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              {!step.completed && (
                <Button size="sm" variant="outline">
                  Start
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => handleComplete()}>
            Skip for now
          </Button>
          <Button 
            onClick={() => handleComplete()}
            disabled={completedSteps < steps.length}
          >
            {completedSteps < steps.length ? 'Complete all steps' : 'Get Started!'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingGuide;