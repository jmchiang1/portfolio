// ============================================
// Supabase config — copy this file to
// `supabase-config.js` and fill in the values.
// `supabase-config.js` is gitignored so your keys
// never end up in the repo.
//
// 1. New project at https://supabase.com
//    (wait ~1 min for provisioning)
// 2. Project Settings → API Keys
//    - Project URL                 → SUPABASE_URL
//    - anon / publishable key      → SUPABASE_ANON_KEY
//    NEVER paste a `sb_secret_…` / service_role key here.
//    Anything in this file ships to the browser.
// 3. SQL Editor → paste schema from supabase-schema.sql
// 4. Make sure Row Level Security is enabled on the
//    `visitors` table with a policy that only allows
//    INSERT (and the SELECT shape used by visitors.html).
//
// Leaving these blank is safe: the welcome flow still
// works locally, it just won't persist to a backend.
// ============================================
window.SUPABASE_URL      = ""; // e.g. "https://abcdxyz.supabase.co"
window.SUPABASE_ANON_KEY = ""; // anon / publishable key (starts with "sb_publishable_" or "eyJ…")
