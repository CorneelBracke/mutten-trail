// server/utils/supabase.ts
// Deze helper maakt EENMALIG een Supabase client aan voor server-side gebruik.
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#imports'

let supabaseInstance: SupabaseClient | null = null

export function getDbClient(): SupabaseClient {
  if (!supabaseInstance) {
    const config = useRuntimeConfig()

    const supabaseUrl = config.public.supabaseUrl // Haal op uit runtime config
    const supabaseKey = config.supabaseKey       // Haal op uit runtime config (private)

    if (!supabaseUrl || !supabaseKey) {
      console.error('FATAL ERROR: Supabase URL or Key is missing in runtimeConfig/environment variables!');
      throw new Error('Supabase configuration is missing.');
    }

    console.log('>>> [Utils] Initializing Supabase client...');
    try {
        supabaseInstance = createClient(supabaseUrl, supabaseKey, {
            // Optionele Supabase client opties hier
             auth: {
                 // Belangrijk: voorkom dat de server client sessies probeert te beheren
                 autoRefreshToken: false,
                 persistSession: false,
                 detectSessionInUrl: false
             }
        });
        console.log('>>> [Utils] Supabase client initialized successfully.');
    } catch (error) {
        console.error('>>> [Utils] FAILED to initialize Supabase client:', error);
        throw error; // Stop de applicatie als de client niet kan initialiseren
    }
  }
  return supabaseInstance
}

// Optioneel: Exporteer direct een instance als je dat prefereert boven de functie
// export const supabase = getDbClient();