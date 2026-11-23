// Datas no fuso de Brasília (sem horário de verão desde 2019: sempre -03:00).
export const OFFSET = -3;
/** "Agora" com os campos UTC valendo o horário de Brasília. Use getUTC*(). */
export const agoraBR = (ms = Date.now()) => new Date(ms + OFFSET * 3600e3);
export const kBR = (d: Date) => d.toISOString().slice(0, 10); // d vindo de agoraBR
export const mkBR = (d: Date) => d.toISOString().slice(0, 7);
export const addDiasBR = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);
/** Minutos de "HH:MM" ou null. */
export function minutos(s: unknown) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
export type Docs = Record<string, any>;
/** Todas as páginas de uma pessoa (com filtro opcional de prefixo). */
export async function docsDe(db: any, uid: string, ids: string[]) {
  const { data } = await db.from('docs').select('doc_id,data').eq('user_id', uid).in('doc_id', ids);
  const out: Docs = {};
  (data ?? []).forEach((r: any) => { out[r.doc_id] = r.data; });
  return out;
}
/** Tarefas fixas (t-rot) que valem no dia: d vindo de agoraBR. */
export function fixasDoDia(docs: Docs, d: Date) {
  const r = docs['t-rot']?.r;
  const k = kBR(d);
  return (Array.isArray(r) ? r : []).filter((x: any) => x?.id && (x.days || []).map(Number).includes(d.getUTCDay()) && (!x.from || x.from <= k));
}
/** Confere o segredo das chamadas agendadas (pg_cron). */
export const doCron = (req: Request) => {
  const s = Deno.env.get('CRON_SECRET');
  return !!s && req.headers.get('x-cron') === s;
};
