import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// No celular, o localStorage vem do expo-sqlite (a sessão fica salva no aparelho).
// No navegador já existe localStorage.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-sqlite/localStorage/install');
}

// Projeto Supabase do Dear Days. A chave "publishable" é pública (feita para ficar no site e no app);
// a segurança dos dados vem das regras (RLS) da tabela. Pode trocar pelo .env ou pelas variáveis da Netlify.
const DEFAULT_URL = 'https://fjpqwwqkewkqlhxwbeau.supabase.co';
const DEFAULT_KEY = 'sb_publishable_wm_9gdf2WUn_ckcKjkex9w_xw5oEDoj';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_KEY;

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
