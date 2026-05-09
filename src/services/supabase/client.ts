import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

type SupabaseClient = any;
let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient !== null) return cachedClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const { createClient } = require('@supabase/supabase-js');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    const storage = {
      getItem: (key: string) => AsyncStorage.getItem(key).catch(() => null),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value).catch((e: any) => console.warn('supabase storage setItem failed:', e)),
      removeItem: (key: string) => AsyncStorage.removeItem(key).catch((e: any) => console.warn('supabase storage removeItem failed:', e)),
    };

    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
  } catch (e) {
    console.warn('Supabase init failed:', e);
  }
  return cachedClient;
}
