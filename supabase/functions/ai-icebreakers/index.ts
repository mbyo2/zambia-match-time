import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { match_id } = await req.json();
    if (!match_id || typeof match_id !== "string") {
      return new Response(JSON.stringify({ error: "match_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const me = userData.user.id;
    const { data: match } = await supabase
      .from("matches")
      .select("user1_id,user2_id")
      .eq("id", match_id)
      .maybeSingle();
    if (!match || (match.user1_id !== me && match.user2_id !== me)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const otherId = match.user1_id === me ? match.user2_id : match.user1_id;

    const [{ data: meP }, { data: otherP }] = await Promise.all([
      supabase.from("profiles").select("first_name,bio,interests,occupation").eq("id", me).maybeSingle(),
      supabase.from("profiles").select("first_name,bio,interests,occupation").eq("id", otherId).maybeSingle(),
    ]);

    const prompt = `You write short, warm, original dating-app openers. Generate exactly 3 distinct openers (one per line, no numbering, max 140 chars each) for ${meP?.first_name ?? "User"} to send to ${otherP?.first_name ?? "their match"}.

Their bio: ${otherP?.bio ?? "(empty)"}
Their interests: ${(otherP?.interests ?? []).join(", ") || "(none)"}
Their occupation: ${otherP?.occupation ?? "(unknown)"}

About me: ${meP?.bio ?? "(empty)"} | interests: ${(meP?.interests ?? []).join(", ") || "(none)"}

Be playful, specific, never generic ("hey", "what's up"), and ask a question.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      return new Response(JSON.stringify({ error: "ai_failed", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await aiResp.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    const openers = text.split("\n").map((l: string) => l.replace(/^[\-\d\.\)\s]+/, "").trim()).filter(Boolean).slice(0, 3);

    return new Response(JSON.stringify({ openers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});