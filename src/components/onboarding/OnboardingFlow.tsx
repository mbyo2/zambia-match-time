import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Heart, User, MapPin, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Database } from '@/integrations/supabase/types';

type EducationLevel = Database['public']['Enums']['education_level'];
type GenderType = Database['public']['Enums']['gender_type'];

const zambianCities = [
  'Lusaka', 'Ndola', 'Kitwe', 'Kabwe', 'Chingola', 'Mufulira', 'Luanshya',
  'Kasama', 'Chipata', 'Livingstone', 'Mongu', 'Solwezi',
  'Mansa', 'Choma', 'Kapiri Mposhi', 'Mazabuka', 'Kafue'
];

const zambianProvinces = [
  'Central Province', 'Copperbelt Province', 'Eastern Province', 'Luapula Province',
  'Lusaka Province', 'Muchinga Province', 'Northern Province', 'North-Western Province',
  'Southern Province', 'Western Province'
];

const interestOptions = [
  'Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Dancing',
  'Photography', 'Art', 'Movies', 'Fitness', 'Nature', 'Technology',
  'Fashion', 'Business', 'Education', 'Culture', 'Adventure'
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '' as GenderType,
    bio: '',
    occupation: '',
    education: '' as EducationLevel,
    location_city: '',
    location_state: '',
    interested_in: ['male', 'female'] as GenderType[],
    age_min: 18,
    age_max: 35,
    selected_interests: [] as string[],
  });

  const update = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    const current = profileData.selected_interests;
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : current.length < 5 ? [...current, interest] : current;
    update('selected_interests', updated);
  };

  const toggleInterestedIn = (gender: GenderType) => {
    const current = profileData.interested_in;
    const updated = current.includes(gender)
      ? current.filter(g => g !== gender)
      : [...current, gender];
    update('interested_in', updated);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          date_of_birth: profileData.date_of_birth,
          gender: profileData.gender,
          bio: profileData.bio,
          occupation: profileData.occupation,
          education: profileData.education || undefined,
          location_city: profileData.location_city,
          location_state: profileData.location_state,
          interested_in: profileData.interested_in,
          age_min: profileData.age_min,
          age_max: profileData.age_max,
          interests: profileData.selected_interests,
          search_preferences: {
            distance: 50,
            age_range: { min: profileData.age_min, max: profileData.age_max },
            interests: profileData.selected_interests,
            relationship_goals: ['serious']
          }
        })
        .eq('id', user.id);

      if (error) {
        logger.error('Profile update error:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Welcome to MatchTime! 🎉', description: 'Your profile is ready.' });
        onComplete();
      }
    } catch (error) {
      logger.error('Unexpected error:', error);
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to MatchTime!',
      description: 'Find meaningful connections',
      icon: <Heart className="h-7 w-7 text-primary" />,
      content: (
        <div className="text-center space-y-4 py-6">
          <div className="text-6xl mb-4">💖</div>
          <h2 className="text-2xl font-bold text-foreground">Ready to find your match?</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            MatchTime helps you discover compatible people in your area.
            Let's set up your profile in just a few steps!
          </p>
        </div>
      ),
      canProceed: true,
    },
    {
      id: 'basics',
      title: 'About You',
      description: 'The essentials',
      icon: <User className="h-7 w-7 text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={profileData.first_name} onChange={e => update('first_name', e.target.value)} placeholder="Your first name" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={profileData.last_name} onChange={e => update('last_name', e.target.value)} placeholder="Last name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input id="dob" type="date" value={profileData.date_of_birth} onChange={e => update('date_of_birth', e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select value={profileData.gender} onValueChange={(v: GenderType) => update('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="bio">About Me</Label>
            <Textarea id="bio" placeholder="Tell people about yourself..." value={profileData.bio} onChange={e => update('bio', e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Occupation</Label>
              <Input value={profileData.occupation} onChange={e => update('occupation', e.target.value)} placeholder="What do you do?" />
            </div>
            <div>
              <Label>Education</Label>
              <Select value={profileData.education} onValueChange={(v: EducationLevel) => update('education', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="some_college">Some College</SelectItem>
                  <SelectItem value="bachelors">Bachelor's</SelectItem>
                  <SelectItem value="masters">Master's</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="trade_school">Trade School</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
      canProceed: !!profileData.first_name && !!profileData.date_of_birth && !!profileData.gender,
    },
    {
      id: 'location',
      title: 'Your Location',
      description: 'Help us find people near you',
      icon: <MapPin className="h-7 w-7 text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Select value={profileData.location_city} onValueChange={v => update('location_city', v)}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {zambianCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Province</Label>
              <Select value={profileData.location_state} onValueChange={v => update('location_state', v)}>
                <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>
                  {zambianProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <Label className="font-medium">I'm interested in</Label>
            <div className="flex gap-3">
              {(['male', 'female', 'non_binary'] as GenderType[]).map(g => (
                <div key={g} className="flex items-center gap-2">
                  <Checkbox id={`int-${g}`} checked={profileData.interested_in.includes(g)} onCheckedChange={() => toggleInterestedIn(g)} />
                  <Label htmlFor={`int-${g}`} className="text-sm capitalize">{g === 'non_binary' ? 'Non-binary' : g}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Age</Label>
              <Input type="number" min={18} max={99} value={profileData.age_min} onChange={e => update('age_min', parseInt(e.target.value) || 18)} />
            </div>
            <div>
              <Label>Max Age</Label>
              <Input type="number" min={18} max={99} value={profileData.age_max} onChange={e => update('age_max', parseInt(e.target.value) || 99)} />
            </div>
          </div>
        </div>
      ),
      canProceed: true,
    },
    {
      id: 'interests',
      title: 'Your Interests',
      description: 'Pick up to 5 that define you',
      icon: <Sparkles className="h-7 w-7 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selected: {profileData.selected_interests.length}/5
          </p>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(interest => {
              const selected = profileData.selected_interests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      ),
      canProceed: true,
    },
    {
      id: 'safety',
      title: 'Stay Safe',
      description: 'Quick safety tips before you start',
      icon: <Shield className="h-7 w-7 text-primary" />,
      content: (
        <div className="space-y-3">
          {[
            { icon: '🏙️', label: 'Meet in public', text: 'Always meet new people in public places for first dates.' },
            { icon: '🛡️', label: 'Trust your instincts', text: "If something feels off, block or report the user." },
            { icon: '🔒', label: 'Protect your info', text: "Don't share sensitive details too quickly." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg border border-border">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      ),
      canProceed: true,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.content}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!currentStepData.canProceed || isSubmitting}>
              {isSubmitting ? 'Creating...' : isLastStep ? "Let's Go! 🚀" : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
