// Lembretes no navegador (site instalado na tela inicial), por notificação push.
//  GET  -> devolve a chave pública (o site usa para pedir permissão)
//  POST com header x-cron -> chamado a cada 5 minutos pelo pg_cron: envia o que está na hora
// Segredos: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET (e opcional VAPID_EMAIL)
import webpush from 'npm:web-push@3.6.7';
import { admin, cors, json } from '../_shared/asaas.ts';
import { agoraBR, addDiasBR, docsDe, doCron, fixasDoDia, kBR, minutos } from '../_shared/br.ts';

const PUB = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const PRIV = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const JANELA = 5; // minutos entre uma rodada e outra
const MAX_TAREFAS_DIA = 8;
const AGUA = [10, 13, 16, 19];

type Aviso = { id: string; title: string; body: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } });
  if (req.method === 'GET') return json({ publicKey: PUB });
  if (!doCron(req)) return json({ erro: 'não autorizado' }, 401);
  if (!PUB || !PRIV) return json({ erro: 'faltam as chaves VAPID' }, 500);
  webpush.setVapidDetails('mailto:' + (Deno.env.get('VAPID_EMAIL') ?? 'contato@deardays.app'), PUB, PRIV);

  const db = admin();
  const { data: subs } = await db.from('push_subs').select('endpoint,user_id,sub');
  const porPessoa = new Map<string, any[]>();
  (subs ?? []).forEach((s: any) => porPessoa.set(s.user_id, [...(porPessoa.get(s.user_id) ?? []), s]));

  const agora = agoraBR();
  const hoje = kBR(agora);
  const minAgora = agora.getUTCHours() * 60 + agora.getUTCMinutes();
  const naHora = (m: number | null) => m != null && m <= minAgora && m > minAgora - JANELA;
  let enviados = 0;

  for (const [uid, lista] of porPessoa) {
    const docs = await docsDe(db, uid, ['t-cfg', 'd-' + hoje, 't-rot', 't-wish']);
    const av = docs['t-cfg']?.app?.avisos ?? {};
    const doc = docs['d-' + hoje] ?? {};
    const avisos: Aviso[] = [];
    if (av.tarefas) {
      const l: { t: string; time: string; first?: string; id: string }[] = [];
      (Array.isArray(doc.tl) ? doc.tl : []).forEach((t: any, i: number) => { if (t?.t && t.time && !t.ok) l.push({ t: t.t, time: t.time, first: t.first, id: 't' + i }); });
      fixasDoDia(docs, agora).forEach((r: any) => { if (r.time && !doc.rd?.[r.id] && !doc.rs?.[r.id]) l.push({ t: r.t, time: r.time, id: 'r' + r.id }); });
      l.sort((a, b) => a.time.localeCompare(b.time)).slice(0, MAX_TAREFAS_DIA).forEach((x) => {
        if (naHora(minutos(x.time))) avisos.push({ id: `${hoje}-${x.id}-${x.time}`, title: x.t, body: x.first ? `Comece por: ${x.first}` : 'Está na hora. Um passo de cada vez.' });
      });
    }
    if (av.agua) {
      const w = Number(doc.water || 0);
      AGUA.forEach((h, j) => {
        if (w < (j + 1) * 2 && naHora(h * 60)) avisos.push({ id: `${hoje}-agua${h}`, title: 'Um copo de água?', body: 'Pausa rápida para se hidratar.' });
      });
    }
    if (av.compras) {
      const l = docs['t-wish']?.l;
      (Array.isArray(l) ? l : []).forEach((x: any) => {
        if (!x?.id || !x.at) return;
        const em = new Date(new Date(x.at).getTime() + 864e5);
        const emBR = agoraBR(em.getTime());
        if (kBR(emBR) === hoje && naHora(emBR.getUTCHours() * 60 + emBR.getUTCMinutes()))
          avisos.push({ id: `wish-${x.id}`, title: 'Ainda quer comprar?', body: `${x.t}: já passaram 24 horas. Decida com calma.` });
      });
    }
    for (const a of avisos) {
      // não repete o mesmo aviso
      const { error } = await db.from('push_sent').insert({ id: `${uid}-${a.id}` });
      if (error) continue;
      for (const s of lista) {
        try {
          await webpush.sendNotification(s.sub, JSON.stringify({ title: a.title, body: a.body, url: '/dia' }));
          enviados++;
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subs').delete().eq('endpoint', s.endpoint);
        }
      }
    }
  }
  // limpeza dos registros de envio antigos
  await db.from('push_sent').delete().lt('sent_at', kBR(addDiasBR(agora, -3)));
  return json({ ok: true, enviados });
});
