// Resumo da semana por e-mail (domingo à noite, pelo pg_cron).
// Segredos: RESEND_API_KEY, EMAIL_DE (ex.: "Dear Days <oi@seudominio.com.br>"), CRON_SECRET, SITE_URL
// Quem desligou em Conta > Avisos (t-cfg.app.avisos.resumo === false) não recebe.
import { admin, json } from '../_shared/asaas.ts';
import { agoraBR, addDiasBR, docsDe, doCron, fixasDoDia, kBR, mkBR } from '../_shared/br.ts';

const SITE = Deno.env.get('SITE_URL') ?? 'https://dear-day.netlify.app';
const MOODN = ['radiante', 'alegria', 'plenitude', 'tristeza', 'ansiedade', 'raiva'];

function html(nome: string, r: { feitas: number; total: number; habitos: number; diasHab: number; agua: number; humor: string | null; dias: number }) {
  const linha = (n: string | number, t: string) =>
    `<td style="padding:14px 10px;text-align:center"><div style="font-family:Georgia,serif;font-size:30px;color:#2F2B27">${n}</div><div style="font-size:13px;color:#6B635B">${t}</div></td>`;
  const frase = r.feitas === 0 && r.diasHab === 0
    ? 'A semana foi corrida? Tudo bem. Abrir o planner por 2 minutos já é um recomeço.'
    : r.feitas >= r.total * 0.7
      ? 'Que semana bonita. Lembre de descansar também.'
      : 'Cada tarefa feita conta. O que ficou para trás pode ir para a próxima semana, sem culpa.';
  return `<!doctype html><html><body style="margin:0;background:#FAF7F2;font-family:Helvetica,Arial,sans-serif;color:#2F2B27">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="font-family:Georgia,serif;font-size:22px;color:#8A6579">Dear Days</div>
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:30px;margin:18px 0 6px">Sua semana${nome ? ', ' + nome : ''}</h1>
<p style="color:#6B635B;line-height:1.5;margin:0 0 18px">${frase}</p>
<table style="width:100%;background:#fff;border-radius:18px;border-collapse:separate"><tr>
${linha(r.feitas, r.total ? `de ${r.total} tarefas feitas` : 'tarefas feitas')}
${linha(r.habitos, 'hábitos mantidos')}
${linha(r.dias, 'dias com registro')}
</tr></table>
${r.humor ? `<p style="margin:18px 0 0;color:#6B635B">O sentimento que mais apareceu: <b style="color:#2F2B27">${r.humor}</b>.</p>` : ''}
<p style="margin:26px 0"><a href="${SITE}/revisao" style="background:#8A6579;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;display:inline-block">Fazer a revisão da semana</a></p>
<p style="font-size:12px;color:#9A9087;line-height:1.5">Você recebe este resumo porque usa o Dear Days. Para parar, abra Conta &gt; Avisos e desligue “Resumo da semana”.</p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  if (!doCron(req)) return json({ erro: 'não autorizado' }, 401);
  const KEY = Deno.env.get('RESEND_API_KEY');
  const DE = Deno.env.get('EMAIL_DE');
  if (!KEY || !DE) return json({ erro: 'faltam RESEND_API_KEY e EMAIL_DE' }, 500);
  const db = admin();
  const hoje = agoraBR();
  const dias = Array.from({ length: 7 }, (_, i) => addDiasBR(hoje, -i));
  let enviados = 0;
  for (let page = 1; page < 50; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    for (const u of users) {
      if (!u.email || !u.email_confirmed_at) continue;
      const ids = ['t-cfg', 't-habs', 't-rot', ...dias.map((d) => 'd-' + kBR(d)), ...new Set(dias.map((d) => 'm-' + mkBR(d)))];
      const docs = await docsDe(db, u.id, ids);
      if (docs['t-cfg']?.app?.avisos?.resumo === false) continue;
      let feitas = 0, total = 0, agua = 0, comReg = 0;
      const humores: number[] = [];
      for (const d of dias) {
        const doc = docs['d-' + kBR(d)];
        const tl = Array.isArray(doc?.tl) ? doc.tl.filter((t: any) => t?.t) : [];
        const fx = fixasDoDia(docs, d).filter((r: any) => !doc?.rs?.[r.id]);
        total += tl.length + fx.length;
        feitas += tl.filter((t: any) => t.ok).length + fx.filter((r: any) => doc?.rd?.[r.id]).length;
        agua += Number(doc?.water || 0);
        if (doc && Object.keys(doc).length) comReg++;
        if (doc?.mood) humores.push(Number(doc.mood));
      }
      const hl = Array.isArray(docs['t-habs']?.hl) ? docs['t-habs'].hl.filter((h: any) => h?.id) : [];
      let habitos = 0, diasHab = 0;
      hl.forEach((h: any) => {
        const n = dias.filter((d) => docs['m-' + mkBR(d)]?.hk?.[h.id]?.[d.getUTCDate()]).length;
        diasHab += n;
        if (n >= 4) habitos++;
      });
      if (!comReg && !diasHab) continue; // quem não usou na semana não recebe números zerados
      const cont = new Map<number, number>();
      humores.forEach((m) => cont.set(m, (cont.get(m) ?? 0) + 1));
      const top = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
      const nome = String(u.user_metadata?.nome ?? '').split(' ')[0];
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: DE, to: u.email,
          subject: feitas ? `Sua semana: ${feitas} tarefa${feitas === 1 ? '' : 's'} feita${feitas === 1 ? '' : 's'}` : 'Sua semana no Dear Days',
          html: html(nome, { feitas, total, habitos, diasHab, agua, humor: top ? MOODN[top[0] - 1] ?? null : null, dias: comReg }),
        }),
      });
      if (r.ok) enviados++;
      else console.error('resend', u.id, r.status, await r.text());
    }
    if (users.length < 200) break;
  }
  return json({ ok: true, enviados });
});
