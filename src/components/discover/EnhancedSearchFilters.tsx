
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface SearchFilters {
  ageRange: [number, number];
  heightRange: [number, number];
  distance: number;
  education: string[];
  interests: string[];
  relationshipGoals: string[];
  bodyTypes: string[];
  ethnicities: string[];
  religion: string;
  smoking: string;
  drinking: string;
}

interface EnhancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
}

const EnhancedSearchFilters: React.FC<EnhancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const educationLevels = [
    'high_school',
    'some_college',
    'bachelors',
    'masters',
    'phd',
    'trade_school',
    'other'
  ];

  const commonInterests = [
    'Travel', 'Photography', 'Music', 'Fitness', 'Cooking', 'Movies',
    'Reading', 'Gaming', 'Art', 'Sports', 'Dancing', 'Nature',
    'Technology', 'Fashion', 'Food', 'Adventure'
  ];

  const relationshipGoalOptions = [
    'casual', 'serious', 'friendship', 'networking'
  ];

  const bodyTypeOptions = [
    'Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size'
  ];

  const ethnicityOptions = [
    'Asian', 'Black', 'Hispanic', 'White', 'Mixed', 'Other'
  ];

  const religionOptions = [
    'Christian', 'Muslim', 'Jewish', 'Hindu', 'Buddhist', 'Other', 'None'
  ];

  const lifestyleOptions = ['Never', 'Sometimes', 'Often', 'Prefer not to say'];

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearFilters = () => {
    onFiltersChange({
      ageRange: [18, 99],
      heightRange: [150, 200],
      distance: 50,
      education: [],
      interests: [],
      relationshipGoals: [],
      bodyTypes: [],
      ethnicities: [],
      religion: '',
      smoking: '',
      drinking: ''
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.education.length > 0) count++;
    if (filters.interests.length > 0) count++;
    if (filters.relationshipGoals.length > 0) count++;
    if (filters.bodyTypes.length > 0) count++;
    if (filters.ethnicities.length > 0) count++;
    if (filters.religion) count++;
    if (filters.smoking) count++;
    if (filters.drinking) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()}</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Filters - Always Visible */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
            </label>
            <Slider
              value={filters.ageRange}
              onValueChange={(value) => updateFilter('ageRange', value)}
              max={99}
              min={18}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Distance: {filters.distance} km
            </label>
            <Slider
              value={[filters.distance]}
              onValueChange={(value) => updateFilter('distance', value[0])}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="space-y-6">
            {/* Height Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Height Range: {filters.heightRange[0]}cm - {filters.heightRange[1]}cm
              </label>
              <Slider
                value={filters.heightRange}
                onValueChange={(value) => updateFilter('heightRange', value)}
                max={220}
                min={140}
                step={1}
                className="w-full"
              />
            </div>

            {/* Education */}
            <div>
              <label className="text-sm font-medium mb-2 block">Education</label>
              <div className="grid grid-cols-2 gap-2">
                {educationLevels.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={level}
                      checked={filters.education.includes(level)}
                      onCheckedChange={() => toggleArrayFilter('education', level)}
                    />
                    <label htmlFor={level} className="text-sm capitalize">
                      {level.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="text-sm font-medium mb-2 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {commonInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={filters.interests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('interests', interest)}
                  >
                    {interest}
                    {filters.interests.includes(interest) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Relationship Goals */}
            <div>
              <label className="text-sm font-medium mb-2 block">Looking For</label>
              <div className="grid grid-cols-2 gap-2">
                {relationshipGoalOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={filters.relationshipGoals.includes(goal)}
                      onCheckedChange={() => toggleArrayFilter('relationshipGoals', goal)}
                    />
                    <label htmlFor={goal} className="text-sm capitalize">
                      {goal}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Body Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Body Type</label>
              <div className="flex flex-wrap gap-2">
                {bodyTypeOptions.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.bodyTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('bodyTypes', type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ethnicity */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ethnicity</label>
              <div className="flex flex-wrap gap-2">
                {ethnicityOptions.map((ethnicity) => (
                  <Badge
                    key={ethnicity}
                    variant={filters.ethnicities.includes(ethnicity) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('ethnicities', ethnicity)}
                  >
                    {ethnicity}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Religion */}
            <div>
              <label className="text-sm font-medium mb-2 block">Religion</label>
              <Select value={filters.religion} onValueChange={(value) => updateFilter('religion', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  {religionOptions.map((religion) => (
                    <SelectItem key={religion} value={religion}>
                      {religion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Smoking */}
            <div>
              <label className="text-sm font-medium mb-2 block">Smoking</label>
              <Select value={filters.smoking} onValueChange={(value) => updateFilter('smoking', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select smoking preference" />
                </SelectTrigger>
                <SelectContent>
                  {lifestyleOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drinking */}
            <div>
              <label className="text-sm font-medium mb-2 block">Drinking</label>
              <Select value={filters.drinking} onValueChange={(value) => updateFilter('drinking', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select drinking preference" />
                </SelectTrigger>
                <SelectContent>
                  {lifestyleOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onApply} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedSearchFilters;
