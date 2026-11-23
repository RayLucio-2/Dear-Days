// Lê a agenda da pessoa pelo "endereço secreto no formato iCal" do Google Agenda (ou Outlook, iCloud)
// e devolve os eventos de alguns dias. Só leitura: nada é alterado na agenda.
import { cors, json, userFrom } from '../_shared/asaas.ts';

type Ev = { title: string; day: string; start?: string; end?: string; allDay: boolean };

const unfold = (s: string) => s.replace(/\r?\n[ \t]/g, '');
const esc = (s: string) => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

/** "20261112T090000Z" / "20261112T090000" (TZID) / "20261112" -> Date com campos UTC = hora de Brasília */
function quando(v: string, params: string): { d: Date; allDay: boolean } | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(v);
  if (!m) return null;
  const [, y, mo, da, h, mi, , z] = m;
  if (!h) return { d: new Date(Date.UTC(+y, +mo - 1, +da)), allDay: true };
  let d = new Date(Date.UTC(+y, +mo - 1, +da, +h, +mi));
  if (z) d = new Date(d.getTime() - 3 * 3600e3); // UTC -> Brasília
  else if (/TZID=/.test(params) && !/Sao_Paulo|Brasilia|America\/(Fortaleza|Recife|Bahia|Belem|Maceio|Araguaina)/i.test(params)) {
    // outro fuso: deixa como está (raro para quem usa no Brasil)
  }
  return { d, allDay: false };
}
const hhmm = (d: Date) => d.toISOString().slice(11, 16);
const dia = (d: Date) => d.toISOString().slice(0, 10);
const DOW = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function eventos(ics: string, de: string, ate: string): Ev[] {
  const out: Ev[] = [];
  const blocos = unfold(ics).split('BEGIN:VEVENT').slice(1);
  for (const b of blocos) {
    const linhas = b.split(/\r?\n/);
    const get = (k: string) => {
      const l = linhas.find((x) => x.startsWith(k + ':') || x.startsWith(k + ';'));
      if (!l) return null;
      const i = l.indexOf(':');
      return { params: l.slice(0, i), v: l.slice(i + 1) };
    };
    if (/^STATUS:CANCELLED/m.test(b)) continue;
    const ini = get('DTSTART'), fim = get('DTEND'), sum = get('SUMMARY'), rr = get('RRULE');
    if (!ini) continue;
    const a = quando(ini.v, ini.params);
    if (!a) continue;
    const e = fim ? quando(fim.v, fim.params) : null;
    const dur = e ? e.d.getTime() - a.d.getTime() : 0;
    const exdates = linhas.filter((l) => l.startsWith('EXDATE')).flatMap((l) => l.slice(l.indexOf(':') + 1).split(',')).map((x) => x.slice(0, 8));
    const base: Omit<Ev, 'day' | 'start' | 'end'> = { title: esc(sum?.v ?? 'Evento'), allDay: a.allDay };
    const push = (d: Date) => {
      const k = dia(d);
      if (k < de || k > ate) return;
      if (exdates.includes(k.replace(/-/g, ''))) return;
      out.push({ ...base, day: k, start: a.allDay ? undefined : hhmm(d), end: a.allDay || !dur ? undefined : hhmm(new Date(d.getTime() + dur)) });
    };
    if (!rr) { push(a.d); continue; }
    // Repetição simples: diária, semanal (com dias), mensal e anual; com UNTIL ou COUNT.
    const p = Object.fromEntries(rr.v.split(';').map((x) => x.split('=')));
    const freq = p.FREQ, inter = Number(p.INTERVAL || 1);
    const until = p.UNTIL ? quando(p.UNTIL, '')?.d : null;
    let count = p.COUNT ? Number(p.COUNT) : Infinity;
    const byday: string[] = p.BYDAY ? p.BYDAY.split(',').map((x: string) => x.replace(/^[-+]?\d+/, '')) : [];
    const fimJanela = new Date(ate + 'T23:59:00Z');
    let cur = new Date(a.d), n = 0;
    while (cur <= fimJanela && n < 1000 && count > 0) {
      if (until && cur > until) break;
      if (freq === 'WEEKLY' && byday.length) {
        // percorre a semana de cur
        const dom = new Date(cur.getTime() - cur.getUTCDay() * 864e5);
        for (let i = 0; i < 7 && count > 0; i++) {
          const x = new Date(dom.getTime() + i * 864e5);
          if (x < a.d || !byday.includes(DOW[i])) continue;
          if (until && x > until) break;
          push(x); count--;
        }
        cur = new Date(dom.getTime() + 7 * inter * 864e5);
      } else {
        push(cur); count--;
        if (freq === 'DAILY') cur = new Date(cur.getTime() + inter * 864e5);
        else if (freq === 'WEEKLY') cur = new Date(cur.getTime() + 7 * inter * 864e5);
        else if (freq === 'MONTHLY') { cur = new Date(cur); cur.setUTCMonth(cur.getUTCMonth() + inter); }
        else if (freq === 'YEARLY') { cur = new Date(cur); cur.setUTCFullYear(cur.getUTCFullYear() + inter); }
        else break;
      }
      n++;
    }
  }
  return out.sort((x, y) => (x.day + (x.start ?? '00')).localeCompare(y.day + (y.start ?? '00')));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await userFrom(req);
    if (!user) return json({ erro: 'Entre na sua conta.' }, 401);
    const b = await req.json().catch(() => ({}));
    const url = String(b.url ?? '').trim().replace(/^webcal:/i, 'https:');
    if (!/^https:\/\/[^\s]+$/i.test(url)) return json({ erro: 'Cole o endereço que começa com https:// e termina com .ics' }, 400);
    const de = /^\d{4}-\d{2}-\d{2}$/.test(b.de) ? b.de : new Date().toISOString().slice(0, 10);
    const ate = /^\d{4}-\d{2}-\d{2}$/.test(b.ate) ? b.ate : de;
    const r = await fetch(url, { headers: { 'User-Agent': 'DearDays/1.0' } });
    if (!r.ok) return json({ erro: 'Não consegui abrir essa agenda. Confira se copiou o endereço secreto inteiro.' }, 400);
    const txt = await r.text();
    if (!txt.includes('BEGIN:VCALENDAR')) return json({ erro: 'Esse endereço não é de uma agenda (.ics).' }, 400);
    return json({ eventos: eventos(txt, de, ate) });
  } catch (e) {
    console.error(e);
    return json({ erro: 'Não foi possível ler a agenda agora.' }, 500);
  }
});
