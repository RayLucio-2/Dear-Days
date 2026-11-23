/**
 * Assinatura (Asaas). Lê a linha da pessoa em "subscriptions" e diz se ela tem acesso.
 * Quem escreve nessa tabela são só as funções do servidor (assinar, cancelar, asaas-webhook).
 */
import { create } from 'zustand';
import { Linking, Platform } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase';

/** Preços mostrados no app. Mantenha iguais a PRECO_MENSAL / PRECO_ANUAL do Supabase. */
export const PLANOS = {
  mensal: { nome: 'Mensal', valor: 14.9, sufixo: '/mês' },
  anual: { nome: 'Anual', valor: 119.9, sufixo: '/ano' },
} as const;
export type Plano = keyof typeof PLANOS;
export type Forma = 'PIX' | 'CREDIT_CARD';

export type Sub = {
  status: 'trial' | 'active' | 'past_due' | 'canceled';
  plan: Plano | null;
  billing_type: Forma | null;
  trial_ends_at: string;
  current_period_end: string | null;
  asaas_subscription_id: string | null;
};

export type Acesso = {
  /** pode usar o planner normalmente */
  liberado: boolean;
  fase: 'teste' | 'ativa' | 'atrasada' | 'cancelada' | 'expirada' | 'desconhecida';
  /** dias que faltam do teste ou do período pago */
  dias: number | null;
  ate: Date | null;
};

const TOLERANCIA_DIAS = 3;
const dias = (d: Date) => Math.max(0, Math.ceil((d.getTime() - Date.now()) / 864e5));

export function acessoDe(s: Sub | null): Acesso {
  // Sem assinatura carregada (offline, tabela ainda não criada, modo local): não bloqueia.
  if (!s) return { liberado: true, fase: 'desconhecida', dias: null, ate: null };
  const fimTeste = new Date(s.trial_ends_at);
  const pago = s.current_period_end ? new Date(s.current_period_end) : null;
  const agora = new Date();
  if (s.status === 'active' && pago && pago > agora) return { liberado: true, fase: 'ativa', dias: dias(pago), ate: pago };
  if (s.status === 'past_due' && pago && pago.getTime() + TOLERANCIA_DIAS * 864e5 > agora.getTime())
    return { liberado: true, fase: 'atrasada', dias: dias(new Date(pago.getTime() + TOLERANCIA_DIAS * 864e5)), ate: pago };
  if (s.status === 'canceled' && pago && pago > agora) return { liberado: true, fase: 'cancelada', dias: dias(pago), ate: pago };
  if (s.status === 'trial' && fimTeste > agora) return { liberado: true, fase: 'teste', dias: dias(fimTeste), ate: fimTeste };
  // pagou antes do fim do teste: vale o que for maior
  if (pago && pago > agora) return { liberado: true, fase: 'ativa', dias: dias(pago), ate: pago };
  return { liberado: false, fase: 'expirada', dias: 0, ate: pago ?? fimTeste };
}

type State = {
  sub: Sub | null;
  carregado: boolean;
  carregar: (uid: string) => Promise<void>;
  limpar: () => void;
};

let canal: RealtimeChannel | null = null;

export const useAssinatura = create<State>((set) => ({
  sub: null,
  carregado: false,
  async carregar(uid) {
    if (!supabaseReady || uid === 'local') return set({ sub: null, carregado: true });
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', uid).maybeSingle();
    set({ sub: error ? null : (data as Sub | null), carregado: true });
    canal?.unsubscribe();
    canal = supabase
      .channel('sub-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${uid}` }, (p: any) => {
        if (p.new && p.new.user_id) set({ sub: p.new as Sub });
      })
      .subscribe();
  },
  limpar() {
    canal?.unsubscribe();
    canal = null;
    set({ sub: null, carregado: false });
  },
}));

export const useAcesso = () => acessoDe(useAssinatura((s) => s.sub));

/** Acesso gratuito para sempre (cortesia, sem cobrança no Asaas). */
export const ehCortesia = (s: Sub | null) =>
  !!s && s.status === 'active' && !s.asaas_subscription_id && !!s.current_period_end && new Date(s.current_period_end).getFullYear() >= 2090;

/** Chama a função "assinar" do Supabase e abre a página de pagamento do Asaas. */
export async function assinar(dados: { plano: Plano; forma: Forma; nome: string; cpf: string; celular?: string }) {
  const { data, error } = await supabase.functions.invoke('assinar', { body: dados });
  if (error) {
    let msg = 'Não foi possível abrir o pagamento agora.';
    try { const b = await (error as any).context?.json?.(); if (b?.erro) msg = b.erro; } catch {}
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  if (data?.link) abrir(data.link);
  return data as { link: string | null; vencimento: string; valor: number };
}

export async function cancelar() {
  const { data, error } = await supabase.functions.invoke('cancelar', { body: {} });
  if (error || data?.erro) throw new Error(data?.erro || 'Não foi possível cancelar agora.');
  return data as { ok: boolean; acessoAte: string | null };
}

export function abrir(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else Linking.openURL(url);
}

export const brlPlano = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Validação de CPF (dígitos verificadores). CNPJ: só confere o tamanho. */
export function cpfValido(v: string) {
  const c = v.replace(/\D/g, '');
  if (c.length === 14) return true;
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

/** 12345678901 -> 123.456.789-01 enquanto digita. */
export function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
