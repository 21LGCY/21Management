import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For demo purposes, allow the app to run without real Supabase
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://your-project.supabase.co' || 
    supabaseAnonKey === 'your-anon-key-here') {
  console.warn('Using demo mode - configure .env.local with real Supabase credentials for full functionality');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://demo.supabase.co', 
  supabaseAnonKey || 'demo-key'
);

// Admin client for server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl || 'https://demo.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);