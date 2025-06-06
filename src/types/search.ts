
import { Json } from '@/integrations/supabase/types';

export interface SearchPreferences {
  age_range: {
    min: number;
    max: number;
  };
  distance: number;
  education_levels: string[];
  interests: string[];
  relationship_goals: string[];
  height_range: {
    min: number;
    max: number;
  };
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  search_criteria: SearchPreferences;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Education types
export type EducationLevel = 'high_school' | 'some_college' | 'bachelors' | 'masters' | 'phd' | 'trade_school' | 'other';

// Relationship goal types
export type RelationshipGoal = 'casual' | 'serious' | 'friendship' | 'networking';

// Helper functions for type conversion
export const jsonToSearchPreferences = (json: Json): SearchPreferences => {
  const obj = json as Record<string, any>;
  return {
    age_range: obj.age_range || { min: 18, max: 99 },
    distance: obj.distance || 50,
    education_levels: obj.education_levels || [],
    interests: obj.interests || [],
    relationship_goals: obj.relationship_goals || [],
    height_range: obj.height_range || { min: 150, max: 200 }
  };
};

export const searchPreferencesToJson = (prefs: SearchPreferences): Json => {
  return prefs as unknown as Json;
};
