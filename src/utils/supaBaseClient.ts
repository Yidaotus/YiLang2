import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "env/schema.mjs";

const supabaseUrl = "https://veqnxktevteuzkqhivkm.supabase.co";
const supabaseKey = clientEnv.NEXT_PUBLIC_SUPABASE_KEY || "";

if (!supabaseKey) {
	console.error("Supabase key not found!");
}

export default createClient(supabaseUrl, supabaseKey);
