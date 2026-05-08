import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Find expired stories
  const { data: expired, error: selErr } = await supabase
    .from('stories')
    .select('id, content_url')
    .lt('expires_at', new Date().toISOString());

  if (selErr) {
    return new Response(JSON.stringify({ error: selErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Delete storage objects (best-effort)
  let storageDeleted = 0;
  for (const s of expired ?? []) {
    if (!s.content_url) continue;
    try {
      const url = new URL(s.content_url);
      // expected path: /storage/v1/object/public/<bucket>/<path>
      const m = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
      if (!m) continue;
      const [, bucket, path] = m;
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (!error) storageDeleted++;
    } catch { /* ignore */ }
  }

  // 3. Delete DB rows
  const { error: delErr, count } = await supabase
    .from('stories')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());

  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    deleted: count ?? 0,
    storage_deleted: storageDeleted,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});