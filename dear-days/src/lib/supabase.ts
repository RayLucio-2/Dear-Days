import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// No celular, o localStorage vem do expo-sqlite (a sessão fica salva no aparelho).
// No navegador já existe localStorage.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-sqlite/localStorage/install');
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabaseReady = !!url && !!anon;

export const supabase = createClient(url || 'https://exemplo.supabase.co', anon || 'chave-ausente', {
  auth: {
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Renova o login só com o app aberto na tela.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
