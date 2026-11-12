// Recebe os avisos do Asaas e libera ou bloqueia o acesso.
// Publicar SEM verificação de login do Supabase (o Asaas não tem login):
//   npx supabase functions deploy asaas-webhook --no-verify-jwt
// A segurança vem do token: o mesmo valor em ASAAS_WEBHOOK_TOKEN e no webhook do Asaas.
import { admin, asaas } from '../_shared/asaas.ts';

const ok = () => new Response('ok', { status: 200 });

/** Soma 1 mês ou 1 ano a uma data AAAA-MM-DD (fim do período pago). */
function fimPeriodo(dueDate: string, ciclo: string) {
  const [y, m, d] = dueDate.split('-').map(Number);
  const dt = ciclo === 'YEARLY' ? new Date(Date.UTC(y + 1, m - 1, d, 23, 59)) : new Date(Date.UTC(y, m, d, 23, 59));
  return dt.toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return ok();
  const esperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? '';
  if (!esperado || req.headers.get('asaas-access-token') !== esperado) {
    return new Response('token inválido', { status: 401 });
  }

  const ev = await req.json().catch(() => null);
  if (!ev?.id || !ev?.event) return ok();
  const db = admin();

  // Aviso repetido? Já foi tratado.
  const { error: dup } = await db.from('asaas_events').insert({ id: ev.id, event: ev.event, payload: ev });
  if (dup) return ok();

  try {
    const p = ev.payment;
    const subId: string | undefined = p?.subscription ?? ev.subscription?.id;
    if (!subId) return ok(); // cobrança avulsa, não é do Dear Days

    const { data: row } = await db.from('subscriptions').select('user_id, asaas_subscription_id').eq('asaas_subscription_id', subId).maybeSingle();
    if (!row) return ok(); // assinatura antiga (já trocada) ou de outro sistema
    const set = (v: Record<string, unknown>) =>
      db.from('subscriptions').update({ ...v, updated_at: new Date().toISOString() }).eq('user_id', row.user_id);

    switch (ev.event) {
      // Pix: chega direto RECEIVED. Cartão: CONFIRMED na hora, RECEIVED uns 30 dias depois.
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        const sub = await asaas(`/subscriptions/${subId}`).catch(() => null);
        await set({ status: 'active', current_period_end: fimPeriodo(p.dueDate, sub?.cycle ?? 'MONTHLY') });
        break;
      }
      case 'PAYMENT_OVERDUE':
        await set({ status: 'past_due' });
        break;
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        await set({ status: 'canceled', current_period_end: new Date().toISOString() });
        break;
      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED':
        await set({ status: 'canceled', asaas_subscription_id: null });
        break;
    }
  } catch (e) {
    console.error(e);
    // Responde 200 mesmo assim: se o Asaas recebe erro várias vezes, ele pausa a fila de avisos.
  }
  return ok();
});
