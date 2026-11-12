// Cria (ou troca) a assinatura da pessoa no Asaas e devolve o link de pagamento.
// Chamada pelo app: supabase.functions.invoke('assinar', { body: { plano, forma, nome, cpf, celular } })
import { admin, asaas, cors, diaBR, digits, json, PRECOS, userFrom } from '../_shared/asaas.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await userFrom(req);
    if (!user) return json({ erro: 'Entre na sua conta para assinar.' }, 401);

    const b = await req.json().catch(() => ({}));
    const plano = b.plano === 'anual' ? 'anual' : 'mensal';
    const forma = b.forma === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX';
    const nome = String(b.nome ?? '').trim().slice(0, 120);
    const cpf = digits(b.cpf);
    const celular = digits(b.celular);
    if (nome.length < 3) return json({ erro: 'Digite seu nome completo.' }, 400);
    if (cpf.length !== 11 && cpf.length !== 14) return json({ erro: 'Digite um CPF (ou CNPJ) válido.' }, 400);

    const db = admin();
    let { data: sub } = await db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
    if (!sub) {
      const ins = await db.from('subscriptions').insert({ user_id: user.id }).select('*').single();
      sub = ins.data;
    }

    // 1) Cliente no Asaas (cria uma vez e reaproveita)
    let customer = sub?.asaas_customer_id as string | null;
    const dadosCliente = { name: nome, cpfCnpj: cpf, email: user.email, mobilePhone: celular || undefined, externalReference: user.id, notificationDisabled: false };
    if (customer) await asaas(`/customers/${customer}`, { method: 'PUT', body: JSON.stringify(dadosCliente) });
    else customer = (await asaas('/customers', { method: 'POST', body: JSON.stringify(dadosCliente) })).id;

    const antiga = sub?.asaas_subscription_id as string | null;

    // 2) Primeira cobrança: no fim do teste grátis (ou hoje, se o teste já acabou)
    const fimTeste = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : new Date();
    const pagoAte = sub?.current_period_end ? new Date(sub.current_period_end) : null;
    const base = [fimTeste, pagoAte ?? new Date(0), new Date()].reduce((a, c) => (c > a ? c : a));
    const nova = await asaas('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer,
        billingType: forma,
        value: PRECOS[plano],
        nextDueDate: diaBR(base),
        cycle: plano === 'anual' ? 'YEARLY' : 'MONTHLY',
        description: `Dear Days, plano ${plano}`,
        externalReference: user.id,
      }),
    });

    await db.from('subscriptions').update({
      plan: plano, billing_type: forma, asaas_customer_id: customer, asaas_subscription_id: nova.id, updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    // 3) Troca de plano ou de forma: só agora cancela a assinatura antiga no Asaas
    //    (depois de gravar a nova, para o aviso de cancelamento não apagar a nova)
    if (antiga && antiga !== nova.id) await asaas(`/subscriptions/${antiga}`, { method: 'DELETE' }).catch(() => null);

    // 4) Link da primeira cobrança (página de pagamento do próprio Asaas: Pix ou cartão)
    const pays = await asaas(`/subscriptions/${nova.id}/payments`);
    const primeira = (pays.data ?? [])[0];
    return json({ link: primeira?.invoiceUrl ?? null, vencimento: nova.nextDueDate, valor: PRECOS[plano] });
  } catch (e) {
    console.error(e);
    return json({ erro: (e as Error).message || 'Não foi possível criar a assinatura agora.' }, 500);
  }
});
