import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  matchId: string;
  onPick: (text: string) => void;
}

const AiIcebreakerSuggestions: React.FC<Props> = ({ matchId, onPick }) => {
  const [openers, setOpeners] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-icebreakers', {
        body: { match_id: matchId },
      });
      if (error) throw error;
      setOpeners(data?.openers ?? []);
    } catch (e: any) {
      setError(e?.message || 'Could not generate openers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setOpeners(null); }, [matchId]);

  if (!openers && !loading && !error) {
    return (
      <div className="px-4 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          className="w-full gap-2 rounded-full"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Suggest AI icebreakers
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" /> AI icebreakers
        </span>
        {!loading && (
          <button onClick={generate} className="text-xs text-primary hover:underline">
            Regenerate
          </button>
        )}
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating openers…
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {openers?.map((o, i) => (
        <button
          key={i}
          onClick={() => onPick(o)}
          className="w-full text-left text-sm bg-muted hover:bg-muted/70 transition-colors rounded-2xl px-3 py-2 border border-border"
        >
          {o}
        </button>
      ))}
    </div>
  );
};

export default AiIcebreakerSuggestions;