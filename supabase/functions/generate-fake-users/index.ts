
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sample Zambian names and data for profile generation
const femaleFirstNames = ["Besa", "Chipo", "Dalitso", "Kondwani", "Ludo", "Mapalo", "Mumba", "Natasha", "Samba", "Thandiwe", "Wezi", "Zola"];
const maleFirstNames = ["Banda", "Chibwe", "Daka", "Kabwe", "Lungu", "Moyo", "Ndhlovu", "Phiri", "Sichone", "Tembo", "Zaza"];
const lastNames = ["Banda", "Phiri", "Mumba", "Tembo", "Sakala", "Lungu", "Daka", "Mwila", "Chanda", "Mulenga", "Soko"];
const occupations = ["Software Engineer", "Doctor", "Teacher", "Accountant", "Entrepreneur", "Marketing Manager", "Graphic Designer", "Civil Servant", "Nurse", "Farmer"];
const cities = ["Lusaka", "Ndola", "Kitwe", "Kabwe", "Chingola", "Mufulira", "Livingstone"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    console.log("Starting fake user generation...");

    for (let i = 0; i < 100; i++) {
      const isFemale = i < 70;
      const gender = isFemale ? "female" : "male";
      const firstName = isFemale 
        ? femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)]
        : maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      const randomNumber = Math.floor(Math.random() * 900) + 100;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomNumber}@matchtime.com`;
      const password = "password123";
      
      const age = Math.floor(Math.random() * (40 - 20 + 1)) + 20; // Age between 20-40
      const year = new Date().getFullYear() - age;
      const dateOfBirth = `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;

      // 1. Pick a curated beautiful Black portrait matching gender (no external AI key needed)
      console.log(`Selecting curated photo for ${email} (${gender})`);

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

      const list = isFemale ? femalePhotoUrls : malePhotoUrls;
      const imageUrl = list[Math.floor(Math.random() * list.length)];

      if (!imageUrl) {
        console.error(`Failed to select image URL for ${email}`);
        continue;
      }
      console.log(`Image URL selected for ${email}`);

      // 2. Sign up user
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth,
            gender: gender,
          },
        },
      });

      let userId: string | null = null;
      if (authError || !authData.user) {
        // If user already exists, fetch their ID and continue to add photos
        if (authError?.message?.includes("User already registered")) {
          const { data: existingProfile, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

          if (profileErr || !existingProfile) {
            console.error(`User exists but profile not found for ${email}:`, profileErr?.message);
            continue;
          }
          userId = existingProfile.id;
          console.log(`Existing user found: ${email}, ID: ${userId}`);
        } else {
          console.error(`Error signing up ${email}:`, authError?.message);
          continue;
        }
      } else {
        userId = authData.user.id;
        console.log(`User created: ${email}, ID: ${userId}`);
      }
      
      // 3. Download image and upload to Supabase Storage
      const remoteImage = await fetch(imageUrl);
      const imageBlob = await remoteImage.blob();
      const photoPath = `${userId}/${Date.now()}.png`;

      await supabaseAdmin.storage
        .from("profile-photos")
        .upload(photoPath, imageBlob, { contentType: "image/png" });

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("profile-photos")
        .getPublicUrl(photoPath);

      console.log(`Photo uploaded for ${userId}: ${publicUrl}`);

      // 4. Update profile with more details
      await supabaseAdmin
        .from("profiles")
        .update({
          bio: `Hi, I'm ${firstName}. Living in ${cities[Math.floor(Math.random() * cities.length)]} and working as a ${occupations[Math.floor(Math.random() * occupations.length)]}. Let's connect!`,
          occupation: occupations[Math.floor(Math.random() * occupations.length)],
          location_city: cities[Math.floor(Math.random() * cities.length)],
          location_state: "Zambia",
          interested_in: [isFemale ? "male" : "female"],
        })
        .eq("id", userId);

      // 5. Add to profile_photos table
      await supabaseAdmin
        .from("profile_photos")
        .insert({
          user_id: userId,
          photo_url: publicUrl,
          is_primary: true,
          order_index: 0,
        });

      console.log(`Profile updated for ${userId}`);
    }

    console.log("Finished generating 100 fake users.");
    return new Response(JSON.stringify({ message: "Successfully generated 100 users." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in generate-fake-users function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
