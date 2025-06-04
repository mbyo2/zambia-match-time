
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Filter, X } from 'lucide-react';

interface SearchPreferences {
  age_range: { min: number; max: number };
  distance: number;
  education_levels: string[];
  interests: string[];
  relationship_goals: string[];
  height_range: { min: number; max: number };
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchPreferences) => void;
  onClose: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange, onClose }) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchPreferences>({
    age_range: { min: 18, max: 99 },
    distance: 50,
    education_levels: [],
    interests: [],
    relationship_goals: [],
    height_range: { min: 150, max: 200 }
  });

  const educationOptions = [
    'high_school', 'some_college', 'bachelors', 'masters', 'phd', 'trade_school', 'other'
  ];

  const relationshipGoalOptions = [
    'casual', 'serious', 'friendship', 'networking'
  ];

  const interestOptions = [
    'Travel', 'Fitness', 'Music', 'Movies', 'Reading', 'Cooking', 'Sports', 
    'Art', 'Technology', 'Gaming', 'Dancing', 'Photography', 'Nature', 'Food'
  ];

  useEffect(() => {
    loadSavedFilters();
  }, [user]);

  const loadSavedFilters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('search_preferences')
        .eq('id', user.id)
        .single();

      if (data?.search_preferences) {
        setFilters(data.search_preferences);
      }
    } catch (error) {
      console.error('Error loading search preferences:', error);
    }
  };

  const saveFilters = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ search_preferences: filters })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving search preferences:', error);
      } else {
        onFiltersChange(filters);
        onClose();
      }
    } catch (error) {
      console.error('Error saving search preferences:', error);
    }
  };

  const updateFilters = (key: keyof SearchPreferences, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Filter size={20} />
          Search Filters
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={20} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Range */}
        <div>
          <Label className="text-sm font-medium">Age Range</Label>
          <div className="mt-2">
            <Slider
              value={[filters.age_range.min, filters.age_range.max]}
              onValueChange={([min, max]) => updateFilters('age_range', { min, max })}
              max={99}
              min={18}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{filters.age_range.min}</span>
              <span>{filters.age_range.max}</span>
            </div>
          </div>
        </div>

        {/* Distance */}
        <div>
          <Label className="text-sm font-medium">Distance (km)</Label>
          <div className="mt-2">
            <Slider
              value={[filters.distance]}
              onValueChange={([distance]) => updateFilters('distance', distance)}
              max={200}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-sm text-gray-500 mt-1">
              Up to {filters.distance} km away
            </div>
          </div>
        </div>

        {/* Height Range */}
        <div>
          <Label className="text-sm font-medium">Height Range (cm)</Label>
          <div className="mt-2">
            <Slider
              value={[filters.height_range.min, filters.height_range.max]}
              onValueChange={([min, max]) => updateFilters('height_range', { min, max })}
              max={220}
              min={140}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{filters.height_range.min}cm</span>
              <span>{filters.height_range.max}cm</span>
            </div>
          </div>
        </div>

        {/* Education */}
        <div>
          <Label className="text-sm font-medium">Education</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {educationOptions.map((edu) => (
              <div key={edu} className="flex items-center space-x-2">
                <Checkbox
                  id={edu}
                  checked={filters.education_levels.includes(edu)}
                  onCheckedChange={() => 
                    updateFilters('education_levels', 
                      toggleArrayItem(filters.education_levels, edu)
                    )
                  }
                />
                <Label htmlFor={edu} className="text-xs capitalize">
                  {edu.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Goals */}
        <div>
          <Label className="text-sm font-medium">Relationship Goals</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {relationshipGoalOptions.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox
                  id={goal}
                  checked={filters.relationship_goals.includes(goal)}
                  onCheckedChange={() => 
                    updateFilters('relationship_goals', 
                      toggleArrayItem(filters.relationship_goals, goal)
                    )
                  }
                />
                <Label htmlFor={goal} className="text-xs capitalize">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <Label className="text-sm font-medium">Interests</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
            {interestOptions.map((interest) => (
              <div key={interest} className="flex items-center space-x-2">
                <Checkbox
                  id={interest}
                  checked={filters.interests.includes(interest)}
                  onCheckedChange={() => 
                    updateFilters('interests', 
                      toggleArrayItem(filters.interests, interest)
                    )
                  }
                />
                <Label htmlFor={interest} className="text-xs">
                  {interest}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
