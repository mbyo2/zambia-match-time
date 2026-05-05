---
name: AI Icebreakers
description: Edge function ai-icebreakers generates 3 AI openers per match via Lovable AI Gateway
type: feature
---
On a match with no messages, ChatView shows AiIcebreakerSuggestions which calls the `ai-icebreakers` edge function. The function uses Lovable AI Gateway (google/gemini-3-flash-preview) with both users' bios/interests/occupation. RLS-checked: caller must belong to the match. Tap an opener to send.
