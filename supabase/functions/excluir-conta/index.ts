// Exclui a conta: cancela a assinatura no Asaas e apaga a pessoa (as tabelas apagam junto, em cascata).
import { admin, asaas, cors, json, userFrom } from '../_shared/asaas.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await userFrom(req);
    if (!user) return json({ erro: 'Entre na sua conta.' }, 401);
    const b = await req.json().catch(() => ({}));
    if (b.confirmo !== 'EXCLUIR') return json({ erro: 'Digite EXCLUIR para confirmar.' }, 400);
    const db = admin();
    const { data: sub } = await db.from('subscriptions').select('asaas_subscription_id').eq('user_id', user.id).maybeSingle();
    if (sub?.asaas_subscription_id) {
      await asaas(`/subscriptions/${sub.asaas_subscription_id}`, { method: 'DELETE' }).catch(() => null);
    }
    await db.from('docs').delete().eq('user_id', user.id);
    await db.from('push_subs').delete().eq('user_id', user.id).then(() => null, () => null);
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ erro: 'Não foi possível excluir agora. Tente de novo ou fale com o suporte.' }, 500);
  }
});
