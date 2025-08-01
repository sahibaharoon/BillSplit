import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  "https://qfpnjctvtmapkenuomre.supabase.co", 
  process.env.SUPABASE_ANON_KEY!  
);

serve(async (req) => {
  const { group_id } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase
    .from("settlements")
    .delete()
    .eq("group_id", group_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ message: "Settlements reset" }), { status: 200 });
});