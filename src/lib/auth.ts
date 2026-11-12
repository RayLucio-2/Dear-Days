import { create } from 'zustand';
import { router } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase';
import { useStore } from './store';
import { useAssinatura } from './assinatura';

type Auth = {
  loading: boolean;
  session: Session | null;
  /** Sem Supabase configurado, o app roda só no aparelho (bom para testar). */
  local: boolean;
  email: string | null;
  start: () => () => void;
  enterLocal: () => void;
  signOut: () => Promise<void>;
};

const LS: Storage | undefined = (globalThis as any).localStorage;
const readLocal = () => { try { return LS?.getItem('planner-local') === '1'; } catch { return false; } };
const writeLocal = (v: boolean) => { try { if (v) LS?.setItem('planner-local', '1'); else LS?.removeItem('planner-local'); } catch {} };

export const useAuth = create<Auth>((set, get) => ({
  loading: true,
  session: null,
  local: false,
  email: null,

  start() {
    if (!supabaseReady) {
      set({ loading: false });
      if (readLocal()) get().enterLocal(); // lembra do "Testar sem conta"
      return () => {};
    }
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, email: data.session?.user.email ?? null, loading: false });
      if (data.session) { useStore.getState().init(data.session.user.id); useAssinatura.getState().carregar(data.session.user.id); }
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // veio do link de "esqueci a senha": abre a Conta para criar a nova senha
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => router.push('/conta'), 300);
      set({ session, email: session?.user.email ?? null });
      if (session) { useStore.getState().init(session.user.id); useAssinatura.getState().carregar(session.user.id); }
      else if (!get().local) { useStore.getState().reset(); useAssinatura.getState().limpar(); }
    });
    return () => data.subscription.unsubscribe();
  },

  enterLocal() {
    writeLocal(true);
    set({ local: true, email: 'neste aparelho' });
    useStore.getState().init('local');
    useAssinatura.getState().carregar('local');
  },

  async signOut() {
    if (get().local) {
      writeLocal(false);
      set({ local: false, email: null });
      useStore.getState().reset();
      return;
    }
    await supabase.auth.signOut();
    useStore.getState().reset();
  },
}));

export const useSignedIn = () => useAuth((a) => !!a.session || a.local);
