
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

      // 1. Generate a beautiful photo of a Black person matching the gender
      console.log(`Generating beautiful photo for ${email} (${gender})`);
      
      const photoPrompt = isFemale 
        ? `Beautiful Black woman, professional headshot, warm smile, elegant lighting, high quality portrait, natural makeup, stylish appearance, confident expression`
        : `Handsome Black man, professional headshot, warm smile, elegant lighting, high quality portrait, well-groomed, stylish appearance, confident expression`;
      
      // Generate the image using OpenAI
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: photoPrompt,
          size: '1024x1024',
          quality: 'high',
          output_format: 'png'
        })
      });
      
      if (!imageResponse.ok) {
        console.error(`Failed to generate image for ${email}:`, await imageResponse.text());
        continue;
      }
      
      const imageData = await imageResponse.json();
      const base64Image = imageData.data[0].b64_json;
      
      if (!base64Image) {
        console.error(`No image data received for ${email}`);
        continue;
      }
      
      console.log(`Image generated for ${email}`);

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

      if (authError || !authData.user) {
        // Ignore "User already registered" errors for idempotency
        if (!authError?.message.includes("User already registered")) {
            console.error(`Error signing up ${email}:`, authError?.message);
        }
        continue;
      }
      const userId = authData.user.id;
      console.log(`User created: ${email}, ID: ${userId}`);
      
      // 3. Convert base64 to blob and upload to Supabase Storage
      const imageBytes = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
      const imageBlob = new Blob([imageBytes], { type: 'image/png' });
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
