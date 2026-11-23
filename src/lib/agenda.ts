/** Eventos do Google Agenda (só leitura), pelo endereço secreto iCal guardado em t-cfg.app.ical. */
import { supabase } from './supabase';

export type Evento = { title: string; day: string; start?: string; end?: string; allDay: boolean };

const cache = new Map<string, { at: number; ev: Evento[] }>();
const VALIDADE = 10 * 60 * 1000; // 10 minutos

export async function eventosDoDia(url: string, dia: string, forcar = false): Promise<Evento[]> {
  const k = url + '|' + dia;
  const c = cache.get(k);
  if (!forcar && c && Date.now() - c.at < VALIDADE) return c.ev;
  const { data, error } = await supabase.functions.invoke('agenda', { body: { url, de: dia, ate: dia } });
  if (error || data?.erro) {
    let msg = data?.erro || 'Não foi possível ler a agenda agora.';
    try { const b = await (error as any)?.context?.json?.(); if (b?.erro) msg = b.erro; } catch {}
    throw new Error(msg);
  }
  const ev = (data?.eventos ?? []) as Evento[];
  cache.set(k, { at: Date.now(), ev });
  return ev;
}

export const icalValido = (s: string) => /^(https|webcal):\/\/\S+$/i.test(s.trim());
