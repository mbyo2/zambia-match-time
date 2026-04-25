import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromptResponse {
  id: string;
  response_text: string;
  prompt: { prompt_text: string; category: string } | null;
}

interface Props {
  userId: string;
}

const ProfilePromptResponses: React.FC<Props> = ({ userId }) => {
  const [responses, setResponses] = useState<PromptResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('user_prompt_responses')
        .select('id, response_text, prompt:icebreaker_prompts(prompt_text, category)')
        .eq('user_id', userId)
        .eq('is_public', true)
        .limit(3);
      if (!cancelled) {
        setResponses((data as any) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading || responses.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">Icebreakers</h3>
      <div className="space-y-2">
        {responses.map((r) => (
          <div key={r.id} className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {r.prompt?.prompt_text}
            </p>
            <p className="text-sm text-foreground">{r.response_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePromptResponses;
