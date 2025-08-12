import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Curated portrait URLs (gender-matched) - no external API keys required
const femalePhotoUrls = [
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
  'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9'
];

const malePhotoUrls = [
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
  'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
  'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const log = (...args: any[]) => console.log("[backfill-profile-photos]", ...args);

  try {
    // Authenticate and authorize caller
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      p_user_id: user.id,
      p_role: 'admin'
    });
    const { data: isSuperAdmin } = await supabaseClient.rpc('is_super_admin', {
      user_id: user.id
    });

    if (!isAdmin && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Parse optional body { limit: number }
    let limit = 200;
    try {
      const body = await req.json();
      if (body && typeof body.limit === 'number' && body.limit > 0) {
        limit = Math.min(body.limit, 1000);
      }
    } catch (_) {
      // no body provided
    }

    log(`Starting backfill. Limit: ${limit}`);

    // Fetch a batch of profiles (we'll filter those with photos as we go)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, gender')
      .limit(2000);

    if (profilesError) {
      log("Error fetching profiles:", profilesError.message);
      return new Response(JSON.stringify({ error: profilesError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    let added = 0;
    let skipped = 0;
    let failed = 0;

    for (const p of profiles ?? []) {
      if (added >= limit) break;

      // Check if user already has at least one photo
      const { count, error: countError } = await supabaseAdmin
        .from('profile_photos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', p.id);

      if (countError) {
        log(`Count error for ${p.id}:`, countError.message);
        failed++;
        continue;
      }

      if ((count ?? 0) > 0) {
        skipped++;
        continue;
      }

      // Pick a curated photo URL based on gender (default random)
      let pool = malePhotoUrls;
      if ((p.gender ?? '').toLowerCase() === 'female') pool = femalePhotoUrls;
      else if ((p.gender ?? '').toLowerCase() === 'male') pool = malePhotoUrls;
      else pool = Math.random() < 0.5 ? femalePhotoUrls : malePhotoUrls;

      const imageUrl = pool[Math.floor(Math.random() * pool.length)];
      if (!imageUrl) {
        log(`No image URL available for ${p.id}`);
        failed++;
        continue;
      }

      try {
        const remoteImage = await fetch(imageUrl);
        if (!remoteImage.ok) throw new Error(`Failed to fetch image: ${remoteImage.status}`);
        const imageBlob = await remoteImage.blob();
        const contentType = imageBlob.type || 'image/jpeg';
        const photoPath = `${p.id}/${Date.now()}.jpg`;

        // Upload to storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from('profile-photos')
          .upload(photoPath, imageBlob, { contentType });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseAdmin.storage
          .from('profile-photos')
          .getPublicUrl(photoPath);

        const publicUrl = publicUrlData.publicUrl;

        // Insert into profile_photos as primary photo
        const { error: insertError } = await supabaseAdmin
          .from('profile_photos')
          .insert({
            user_id: p.id,
            photo_url: publicUrl,
            is_primary: true,
            order_index: 0,
          });

        if (insertError) throw insertError;

        added++;
        log(`Added photo for ${p.id}`);
      } catch (e: any) {
        failed++;
        log(`Failed for ${p.id}:`, e?.message || e);
      }
    }

    const result = { added, skipped, failed };
    log("Backfill complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in backfill-profile-photos:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
