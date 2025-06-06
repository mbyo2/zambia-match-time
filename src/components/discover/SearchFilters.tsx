
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SearchPreferences, SavedSearch, jsonToSearchPreferences, searchPreferencesToJson } from '@/types/search';

interface SearchFiltersProps {
  preferences: SearchPreferences;
  onPreferencesChange: (preferences: SearchPreferences) => void;
}

const educationOptions = [
  'high_school',
  'some_college', 
  'bachelors',
  'masters',
  'phd',
  'trade_school',
  'other'
];

const relationshipGoalOptions = [
  'casual',
  'serious', 
  'friendship',
  'networking'
];

const SearchFilters: React.FC<SearchFiltersProps> = ({ preferences, onPreferencesChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    if (user) {
      fetchSavedSearches();
    }
  }, [user]);

  const fetchSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved searches:', error);
        return;
      }

      const formattedSearches: SavedSearch[] = (data || []).map(search => ({
        ...search,
        search_criteria: jsonToSearchPreferences(search.search_criteria)
      }));

      setSavedSearches(formattedSearches);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your search",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user?.id,
          name: searchName,
          search_criteria: searchPreferencesToJson(preferences)
        });

      if (error) {
        console.error('Error saving search:', error);
        toast({
          title: "Error",
          description: "Failed to save search",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Search saved successfully!",
      });

      setSearchName('');
      fetchSavedSearches();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    onPreferencesChange(search.search_criteria);
    toast({
      title: "Loaded",
      description: `Applied "${search.name}" search filters`,
    });
  };

  const updatePreference = (key: keyof SearchPreferences, value: any) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  const updateAgeRange = (type: 'min' | 'max', value: number) => {
    updatePreference('age_range', {
      ...preferences.age_range,
      [type]: value
    });
  };

  const updateHeightRange = (type: 'min' | 'max', value: number) => {
    updatePreference('height_range', {
      ...preferences.height_range,
      [type]: value
    });
  };

  const toggleEducationLevel = (level: string) => {
    const current = preferences.education_levels;
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    updatePreference('education_levels', updated);
  };

  const toggleRelationshipGoal = (goal: string) => {
    const current = preferences.relationship_goals;
    const updated = current.includes(goal)
      ? current.filter(g => g !== goal)
      : [...current, goal];
    updatePreference('relationship_goals', updated);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6">
        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Saved Searches</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {savedSearches.map((search) => (
                <Button
                  key={search.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSavedSearch(search)}
                >
                  {search.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Age Range */}
        <div>
          <Label className="text-sm font-medium">Age Range</Label>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500">Min</Label>
              <Input
                type="number"
                value={preferences.age_range.min}
                onChange={(e) => updateAgeRange('min', parseInt(e.target.value))}
                min={18}
                max={99}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-500">Max</Label>
              <Input
                type="number"
                value={preferences.age_range.max}
                onChange={(e) => updateAgeRange('max', parseInt(e.target.value))}
                min={18}
                max={99}
              />
            </div>
          </div>
        </div>

        {/* Distance */}
        <div>
          <Label className="text-sm font-medium">
            Distance: {preferences.distance} km
          </Label>
          <Input
            type="range"
            min={1}
            max={200}
            value={preferences.distance}
            onChange={(e) => updatePreference('distance', parseInt(e.target.value))}
            className="mt-2"
          />
        </div>

        {/* Height Range */}
        <div>
          <Label className="text-sm font-medium">Height Range (cm)</Label>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500">Min</Label>
              <Input
                type="number"
                value={preferences.height_range.min}
                onChange={(e) => updateHeightRange('min', parseInt(e.target.value))}
                min={100}
                max={250}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-500">Max</Label>
              <Input
                type="number"
                value={preferences.height_range.max}
                onChange={(e) => updateHeightRange('max', parseInt(e.target.value))}
                min={100}
                max={250}
              />
            </div>
          </div>
        </div>

        {/* Education Levels */}
        <div>
          <Label className="text-sm font-medium">Education Level</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {educationOptions.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={level}
                  checked={preferences.education_levels.includes(level)}
                  onCheckedChange={() => toggleEducationLevel(level)}
                />
                <Label htmlFor={level} className="text-sm capitalize">
                  {level.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Goals */}
        <div>
          <Label className="text-sm font-medium">Looking For</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {relationshipGoalOptions.map((goal) => (
              <div key={goal} className="flex items-center space-x-2">
                <Checkbox
                  id={goal}
                  checked={preferences.relationship_goals.includes(goal)}
                  onCheckedChange={() => toggleRelationshipGoal(goal)}
                />
                <Label htmlFor={goal} className="text-sm capitalize">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Search */}
        <div>
          <Label className="text-sm font-medium">Save This Search</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Enter search name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <Button onClick={saveSearch} size="sm">
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
