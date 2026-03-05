
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
      icon: <Heart className="h-8 w-8 text-primary" />,
      component: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">💖</div>
          <h2 className="text-2xl font-bold text-foreground">Ready to find love?</h2>
          <p className="text-muted-foreground">
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
      icon: <User className="h-8 w-8 text-primary" />,
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Your profile is your first impression</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-accent rounded-lg">
              <h4 className="font-medium mb-2 text-foreground">Be Authentic</h4>
              <p className="text-sm text-muted-foreground">
                Share genuine information about yourself, your interests, and what you're looking for.
              </p>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <h4 className="font-medium mb-2 text-foreground">Add Photos</h4>
              <p className="text-sm text-muted-foreground">
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
      icon: <Camera className="h-8 w-8 text-primary" />,
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Photo Tips</h3>
          <div className="space-y-3">
            {[
              { title: 'Use clear, high-quality images', desc: 'Make sure your face is clearly visible' },
              { title: 'Show your personality', desc: 'Include photos of your hobbies and interests' },
              { title: 'Recent photos only', desc: 'Use photos taken within the last year' },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{tip.title}</p>
                  <p className="text-sm text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'safety',
      title: 'Stay Safe',
      description: 'Your safety and privacy are our top priorities',
      icon: <Shield className="h-8 w-8 text-primary" />,
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Safety Guidelines</h3>
          <div className="space-y-3">
            {[
              { label: 'Meet in public:', text: 'Always meet new people in public places for first dates.' },
              { label: 'Trust your instincts:', text: "If something feels off, don't hesitate to block or report." },
              { label: 'Keep personal info private:', text: "Don't share sensitive information too quickly." },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-accent border border-border rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>{item.label}</strong> {item.text}
                </p>
              </div>
            ))}
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
    <div className="min-h-screen bg-gradient-to-br from-accent to-background flex items-center justify-center p-4">
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
            <div className="text-sm text-muted-foreground">
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
            
            <Button onClick={handleNext}>
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
