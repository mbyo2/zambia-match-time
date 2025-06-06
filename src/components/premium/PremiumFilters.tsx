
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { SearchPreferences } from '@/types/search';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumFiltersProps {
  preferences: SearchPreferences;
  onUpdate: (preferences: SearchPreferences) => void;
}

const PremiumFilters = ({ preferences, onUpdate }: PremiumFiltersProps) => {
  const { subscription } = useSubscription();
  const isPremium = subscription.tier !== 'free';

  const bodyTypes = ['slim', 'average', 'athletic', 'curvy', 'plus_size'];
  const ethnicities = ['asian', 'black', 'hispanic', 'white', 'mixed', 'other'];
  const religions = ['christian', 'muslim', 'jewish', 'hindu', 'buddhist', 'other', 'none'];
  const smokingOptions = ['never', 'socially', 'regularly', 'trying_to_quit'];
  const drinkingOptions = ['never', 'socially', 'regularly'];

  if (!isPremium) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Crown className="h-5 w-5" />
            Premium Filters
            <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
              Premium Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            Upgrade to premium to access advanced filtering options including body type, ethnicity, lifestyle preferences, and more.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-500" />
          Premium Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Body Type Filter */}
        <div className="space-y-2">
          <Label>Body Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {bodyTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox 
                  id={`body-${type}`}
                  checked={preferences.body_types?.includes(type) || false}
                  onCheckedChange={(checked) => {
                    const current = preferences.body_types || [];
                    const updated = checked 
                      ? [...current, type]
                      : current.filter(t => t !== type);
                    onUpdate({ ...preferences, body_types: updated });
                  }}
                />
                <Label htmlFor={`body-${type}`} className="text-sm capitalize">
                  {type.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Ethnicity Filter */}
        <div className="space-y-2">
          <Label>Ethnicity</Label>
          <div className="grid grid-cols-2 gap-2">
            {ethnicities.map((ethnicity) => (
              <div key={ethnicity} className="flex items-center space-x-2">
                <Checkbox 
                  id={`ethnicity-${ethnicity}`}
                  checked={preferences.ethnicities?.includes(ethnicity) || false}
                  onCheckedChange={(checked) => {
                    const current = preferences.ethnicities || [];
                    const updated = checked 
                      ? [...current, ethnicity]
                      : current.filter(e => e !== ethnicity);
                    onUpdate({ ...preferences, ethnicities: updated });
                  }}
                />
                <Label htmlFor={`ethnicity-${ethnicity}`} className="text-sm capitalize">
                  {ethnicity}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Religion Filter */}
        <div className="space-y-2">
          <Label>Religion</Label>
          <Select 
            value={preferences.religion || ''} 
            onValueChange={(value) => onUpdate({ ...preferences, religion: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select religion preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              {religions.map((religion) => (
                <SelectItem key={religion} value={religion}>
                  {religion === 'none' ? 'Not Religious' : religion.charAt(0).toUpperCase() + religion.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lifestyle Preferences */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Smoking</Label>
            <Select 
              value={preferences.smoking || ''} 
              onValueChange={(value) => onUpdate({ ...preferences, smoking: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                {smokingOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace('_', ' ').charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Drinking</Label>
            <Select 
              value={preferences.drinking || ''} 
              onValueChange={(value) => onUpdate({ ...preferences, drinking: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                {drinkingOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumFilters;
