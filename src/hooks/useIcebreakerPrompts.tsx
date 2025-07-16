import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IcebreakerPrompt {
  id: string;
  prompt_text: string;
  category: string;
  is_active: boolean;
}

interface UserPromptResponse {
  id: string;
  prompt_id: string;
  response_text: string;
  is_public: boolean;
  prompt: IcebreakerPrompt;
}

export const useIcebreakerPrompts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
        .order('category');

      if (error) {
        console.error('Error fetching prompts:', error);
        return;
      }

      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const fetchUserResponses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_prompt_responses')
        .select(`
          *,
          icebreaker_prompts (*)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user responses:', error);
        return;
      }

      const formattedResponses = data?.map(response => ({
        ...response,
        prompt: response.icebreaker_prompts
      })) || [];

      setUserResponses(formattedResponses);
    } catch (error) {
      console.error('Error fetching user responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveResponse = async (promptId: string, responseText: string, isPublic: boolean = true) => {
    if (!user) return false;

    try {
      // Check if response already exists
      const existingResponse = userResponses.find(r => r.prompt_id === promptId);

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('user_prompt_responses')
          .update({
            response_text: responseText,
            is_public: isPublic,
          })
          .eq('id', existingResponse.id);

        if (error) throw error;
      } else {
        // Create new response
        const { error } = await supabase
          .from('user_prompt_responses')
          .insert({
            user_id: user.id,
            prompt_id: promptId,
            response_text: responseText,
            is_public: isPublic,
          });

        if (error) throw error;
      }

      toast({
        title: "Response Saved",
        description: "Your icebreaker response has been saved.",
      });

      // Refresh user responses
      fetchUserResponses();
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save response",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_prompt_responses')
        .delete()
        .eq('id', responseId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Response Deleted",
        description: "Your icebreaker response has been deleted.",
      });

      // Refresh user responses
      fetchUserResponses();
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete response",
        variant: "destructive",
      });
      return false;
    }
  };

  const getPromptsByCategory = (category: string) => {
    return prompts.filter(prompt => prompt.category === category);
  };

  const getCategories = () => {
    return [...new Set(prompts.map(prompt => prompt.category))];
  };

  const getUserResponseForPrompt = (promptId: string) => {
    return userResponses.find(response => response.prompt_id === promptId);
  };

  return {
    prompts,
    userResponses,
    loading,
    saveResponse,
    deleteResponse,
    getPromptsByCategory,
    getCategories,
    getUserResponseForPrompt,
    refreshPrompts: fetchPrompts,
    refreshUserResponses: fetchUserResponses,
  };
};