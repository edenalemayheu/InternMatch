// Browser Supabase client. Uses the PUBLIC anon key only (safe to expose).
// Because Row Level Security is ON with no policies, this client can only do
// authentication; all data goes through our Express API (see apiClient.js).
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
