
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IcebreakerPrompt {
  id: string;
  prompt_text: string;
  category: string;
}

interface UserPromptResponse {
  id: string;
  prompt_id: string;
  response_text: string;
  is_public: boolean;
  prompt_text?: string;
}

export const useIcebreakerPrompts = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<IcebreakerPrompt[]>([]);
  const [userResponses, setUserResponses] = useState<UserPromptResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrompts();
      fetchUserResponses();
    }
  }, [user]);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('icebreaker_prompts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }

      setPrompts(data || []);
    } catch (error) {
      console.error('Error in fetchPrompts:', error);
    }
  };

  const fetchUserResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_prompt_responses')
        .select(`
          *,
          icebreaker_prompts:prompt_id (prompt_text)
        `)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching user responses:', error);
        return;
      }

      const responsesWithPrompt = data?.map(response => ({
        ...response,
        prompt_text: response.icebreaker_prompts?.prompt_text
      })) || [];

      setUserResponses(responsesWithPrompt);
    } catch (error) {
      console.error('Error in fetchUserResponses:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveResponse = async (promptId: string, responseText: string, isPublic: boolean = true) => {
    try {
      const { data, error } = await supabase
        .from('user_prompt_responses')
        .upsert({
          user_id: user?.id,
          prompt_id: promptId,
          response_text: responseText,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving response:', error);
        return false;
      }

      await fetchUserResponses();
      return true;
    } catch (error) {
      console.error('Error in saveResponse:', error);
      return false;
    }
  };

  const getRandomPrompt = (category?: string) => {
    const filteredPrompts = category 
      ? prompts.filter(p => p.category === category)
      : prompts;
    
    if (filteredPrompts.length === 0) return null;
    
    return filteredPrompts[Math.floor(Math.random() * filteredPrompts.length)];
  };

  return {
    prompts,
    userResponses,
    loading,
    saveResponse,
    getRandomPrompt,
    refreshPrompts: fetchPrompts
  };
};
