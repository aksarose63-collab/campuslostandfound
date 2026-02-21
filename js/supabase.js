// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
// Replace the values below with your actual Supabase project credentials.
// You can find them in: Supabase Dashboard → Project Settings → API
//
//   SUPABASE_URL  →  "Project URL"
//   SUPABASE_ANON_KEY  →  "anon public" key
// ============================================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use across modules
window._supabase = supabaseClient;
