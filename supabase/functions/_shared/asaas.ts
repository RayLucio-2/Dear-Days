// Partes comuns das funções do Dear Days com o Asaas.
// Segredos (Supabase > Edge Functions > Secrets): ASAAS_API_KEY, ASAAS_ENV ("sandbox" ou "producao"),
// ASAAS_WEBHOOK_TOKEN e, se quiser trocar o preço, PRECO_MENSAL e PRECO_ANUAL.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já coloca sozinho.
import { createClient } from 'npm:@supabase/supabase-js@2';

export const PRECOS = {
  mensal: Number(Deno.env.get('PRECO_MENSAL') ?? '14.90'),
  anual: Number(Deno.env.get('PRECO_ANUAL') ?? '119.90'),
};

const BASE = Deno.env.get('ASAAS_ENV') === 'producao' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';

/** Chamada à API do Asaas (a chave fica só aqui, no servidor). */
export async function asaas(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'DearDays/1.0',
      access_token: Deno.env.get('ASAAS_API_KEY') ?? '',
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.errors?.[0]?.description ?? `Asaas respondeu ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

/** Cliente com poder de servidor (ignora RLS). Nunca vai para o app. */
export const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

/** Quem está chamando, a partir do login do app. */
export async function userFrom(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user ?? null;
}

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Data AAAA-MM-DD no fuso de Brasília. */
export function diaBR(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Só números. */
export const digits = (s: unknown) => String(s ?? '').replace(/\D/g, '');
