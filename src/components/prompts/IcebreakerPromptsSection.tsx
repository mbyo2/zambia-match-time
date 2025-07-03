import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIcebreakerPrompts } from '@/hooks/useIcebreakerPrompts';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Plus, Edit2, Check, X } from 'lucide-react';

const IcebreakerPromptsSection = () => {
  const { prompts, userResponses, saveResponse } = useIcebreakerPrompts();
  const { toast } = useToast();
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [editingResponse, setEditingResponse] = useState<string | null>(null);

  const handleSaveResponse = async () => {
    if (!selectedPrompt || !response.trim()) return;

    const success = await saveResponse(selectedPrompt, response, true);
    if (success) {
      toast({
        title: "Response saved! ✨",
        description: "Your icebreaker response has been added to your profile.",
      });
      setSelectedPrompt(null);
      setResponse('');
    }
  };

  const handleEditResponse = async (responseId: string, newText: string) => {
    const existingResponse = userResponses.find(r => r.id === responseId);
    if (!existingResponse) return;

    const success = await saveResponse(existingResponse.prompt_id, newText, true);
    if (success) {
      toast({
        title: "Response updated! ✨",
        description: "Your response has been updated.",
      });
      setEditingResponse(null);
    }
  };

  const getUnusedPrompts = () => {
    const usedPromptIds = userResponses.map(r => r.prompt_id);
    return prompts.filter(p => !usedPromptIds.includes(p.id));
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      fun: 'bg-yellow-100 text-yellow-800',
      deep: 'bg-purple-100 text-purple-800',
      lifestyle: 'bg-green-100 text-green-800',
      relationship: 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Icebreaker Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Answer fun prompts to help others start conversations with you!
          </p>

          {/* Existing Responses */}
          {userResponses.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-medium">Your Responses</h4>
              {userResponses.map((userResponse) => (
                <Card key={userResponse.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{userResponse.prompt_text}</p>
                      {editingResponse === userResponse.id ? (
                        <div className="flex gap-2">
                          <Input
                            defaultValue={userResponse.response_text}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditResponse(userResponse.id, e.currentTarget.value);
                              } else if (e.key === 'Escape') {
                                setEditingResponse(null);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector(`input[defaultValue="${userResponse.response_text}"]`) as HTMLInputElement;
                              if (input) {
                                handleEditResponse(userResponse.id, input.value);
                              }
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingResponse(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm">{userResponse.response_text}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingResponse(userResponse.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add New Response */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Response
            </h4>
            
            {!selectedPrompt ? (
              <div className="grid gap-3">
                {getUnusedPrompts().slice(0, 6).map((prompt) => (
                  <Card 
                    key={prompt.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedPrompt(prompt.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">{prompt.prompt_text}</p>
                        <Badge className={getCategoryColor(prompt.category)}>
                          {prompt.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="font-medium text-sm">
                      {prompts.find(p => p.id === selectedPrompt)?.prompt_text}
                    </p>
                  </CardContent>
                </Card>
                
                <Input
                  placeholder="Your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveResponse();
                    } else if (e.key === 'Escape') {
                      setSelectedPrompt(null);
                      setResponse('');
                    }
                  }}
                  autoFocus
                />
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveResponse} disabled={!response.trim()}>
                    Save Response
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedPrompt(null);
                      setResponse('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IcebreakerPromptsSection;
