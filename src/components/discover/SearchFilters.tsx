
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Filter, X, Save, Trash2 } from 'lucide-react';

interface SearchPreferences {
  age_range: { min: number; max: number };
  distance: number;
  education_levels: string[];
  interests: string[];
  relationship_goals: string[];
  height_range: { min: number; max: number };
}

interface SavedSearch {
  id: string;
  name: string;
  search_criteria: SearchPreferences;
  is_default: boolean;
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchPreferences) => void;
  onClose: () => void;
  initialFilters?: SearchPreferences;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange, onClose, initialFilters }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchPreferences>(
    initialFilters || {
      age_range: { min: 18, max: 99 },
      distance: 50,
      education_levels: [],
      interests: [],
      relationship_goals: [],
      height_range: { min: 150, max: 200 }
    }
  );
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [newSearchName, setNewSearchName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

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
    if (user) {
      loadSavedSearches();
    }
  }, [user]);

  const loadSavedSearches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading saved searches:', error);
      } else {
        setSavedSearches(data || []);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const saveSearch = async () => {
    if (!user || !newSearchName.trim()) return;

    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name: newSearchName.trim(),
          search_criteria: filters
        });

      if (error) {
        console.error('Error saving search:', error);
        toast({
          title: "Error",
          description: "Failed to save search",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Saved!",
          description: `"${newSearchName}" has been saved`,
        });
        setNewSearchName('');
        setShowSaveForm(false);
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.search_criteria);
    toast({
      title: "Search Loaded",
      description: `"${savedSearch.name}" filters applied`,
    });
  };

  const deleteSavedSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) {
        console.error('Error deleting saved search:', error);
        toast({
          title: "Error",
          description: "Failed to delete search",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Deleted",
          description: "Saved search has been removed",
        });
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  const applyFilters = async () => {
    onFiltersChange(filters);
    onClose();
  };

  const resetFilters = () => {
    setFilters({
      age_range: { min: 18, max: 99 },
      distance: 50,
      education_levels: [],
      interests: [],
      relationship_goals: [],
      height_range: { min: 150, max: 200 }
    });
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
    <Card className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
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
        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Saved Searches</Label>
            <div className="mt-2 space-y-2">
              {savedSearches.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-2 border rounded">
                  <button
                    onClick={() => loadSavedSearch(search)}
                    className="text-sm text-left hover:text-pink-600 flex-1"
                  >
                    {search.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSavedSearch(search.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Save Search */}
        <div>
          {showSaveForm ? (
            <div className="space-y-2">
              <Input
                placeholder="Enter search name..."
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveSearch}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowSaveForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowSaveForm(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save This Search
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
