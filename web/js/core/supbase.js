import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Вставь свои реальные данные URL и KEY
const SUPABASE_URL = "https://uplcrgnxkafcxejwuggx.supabase.co";
const SUPABASE_KEY = "sb_publishable_SDlNlU_Nco34DHqTS0DasA_5jQqyiSF";

export const _sb = createClient(SUPABASE_URL, SUPABASE_KEY);