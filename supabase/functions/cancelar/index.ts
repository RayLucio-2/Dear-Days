// Cancela a assinatura no Asaas. A pessoa continua usando até o fim do período já pago.
import { admin, asaas, cors, json, userFrom } from '../_shared/asaas.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await userFrom(req);
    if (!user) return json({ erro: 'Entre na sua conta.' }, 401);
    const db = admin();
    const { data: sub } = await db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
    if (sub?.asaas_subscription_id) {
      await asaas(`/subscriptions/${sub.asaas_subscription_id}`, { method: 'DELETE' }).catch(() => null);
    }
    await db.from('subscriptions').update({
      status: sub?.status === 'trial' && !sub?.current_period_end ? 'trial' : 'canceled',
      asaas_subscription_id: null, plan: null, updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
    return json({ ok: true, acessoAte: sub?.current_period_end ?? sub?.trial_ends_at ?? null });
  } catch (e) {
    console.error(e);
    return json({ erro: 'Não foi possível cancelar agora. Tente de novo.' }, 500);
  }
});
