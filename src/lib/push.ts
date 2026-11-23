/**
 * Lembretes no site: o navegador recebe notificações push (servidor: função "lembretes").
 * No iPhone só funciona com o site adicionado à Tela de Início (iOS 16.4 ou mais novo).
 */
import { Platform } from 'react-native';
import { supabase } from './supabase';

const web = Platform.OS === 'web' && typeof window !== 'undefined';

export const pushSuportado = () => web && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** Registra o service worker (deixa o site instalável e pronto para push). */
export function registrarSW() {
  if (!web || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

const b64 = (s: string) => {
  const p = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/** Pede permissão e guarda este navegador para receber lembretes. */
export async function ativarPush(): Promise<{ ok: boolean; msg?: string }> {
  if (!pushSuportado()) {
    const ios = /iPhone|iPad/.test(navigator.userAgent);
    return { ok: false, msg: ios ? 'No iPhone: toque em Compartilhar > Adicionar à Tela de Início, abra o Dear Days por lá e ligue de novo.' : 'Este navegador não recebe lembretes. Tente o Chrome, o Edge ou o Safari atualizado.' };
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, msg: 'O navegador não deixou enviar lembretes. Libere nas permissões do site (cadeado ao lado do endereço).' };
  try {
    const { data } = await supabase.functions.invoke('lembretes', { method: 'GET' });
    const key = data?.publicKey;
    if (!key) return { ok: false, msg: 'Os lembretes do site ainda não foram configurados no servidor.' };
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }));
    const j = sub.toJSON();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { ok: false, msg: 'Entre na sua conta.' };
    const { error } = await supabase.from('push_subs').upsert({ endpoint: j.endpoint, user_id: u.user.id, sub: j });
    if (error) return { ok: false, msg: 'Não consegui salvar este aparelho. Tente de novo.' };
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Não foi possível ligar os lembretes agora.' };
  }
}
