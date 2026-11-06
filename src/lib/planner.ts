/**
 * Regras do planner, iguais às do artefato web.
 * Os dados ficam em "docs" (um JSON por id), por exemplo:
 *   d-2026-11-04  dia      | m-2026-11 mês | f-2026-11 finanças
 *   t-habs  hábitos        | t-rot rotinas | t-parc parcelas | t-cfg ajustes
 */
import { key, mkey, fromKey, today } from './dates';
import { num } from './money';

export type Doc = Record<string, any>;
export type Docs = Record<string, Doc>;

export const COR: [string, string][] = [
  ['#D3DEE9', '#5C7894'], ['#EFD6D7', '#A2656A'], ['#D5E1D0', '#66855F'], ['#DFD7EA', '#7A6B98'],
  ['#F1E5C2', '#957A33'], ['#F3DACA', '#A86C4B'], ['#CCE3DF', '#55877F'], ['#EBD5CC', '#95695B'],
  ['#E0E7C9', '#73804A'], ['#F1DCC2', '#9C7642'], ['#E7D3DE', '#8A6579'], ['#D4DEE3', '#5F7785'],
];
/** Cor escolhida em Personalizar (o store avisa quando muda). Sem escolha, cada mês tem a sua. */
let themeOverride: [string, string] | null = null;
export const setThemeOverride = (p: [string, string] | null) => { themeOverride = p; };
export const monthColor = (d: Date): [string, string] => themeOverride ?? COR[d.getMonth()];

export const MOODN = ['radiante', 'alegria', 'plenitude', 'tristeza', 'ansiedade', 'raiva'];
export const MOODC = ['#5E7A52', '#9DB28A', '#C4868D', '#4F6180', '#8797B0', '#B08550'];
export const MOODT = ['#fff', '#2F2B27', '#2F2B27', '#fff', '#2F2B27', '#2F2B27'];
export const CATS = ['#D3DEE9', '#EFD6D7', '#D5E1D0', '#F1DCC2'];
export const CATN = ['azul', 'rosa', 'verde', 'areia'];
export const CATSTRONG = ['#5C7894', '#A2656A', '#66855F', '#9C7642'];
export const EXER = ['nenhum', 'leve', 'médio', 'intenso'];
export const FOOD: [string, string][] = [['cafe', 'café'], ['almoco', 'almoço'], ['lanche', 'lanche'], ['jantar', 'jantar']];

export const FIXAS = ['Aluguel', 'Condomínio', 'Água', 'Luz', 'Internet', 'Celular', 'Academia', 'Parcelas e financiamentos', 'Assinaturas', 'Outros'];
export const VARIA = ['Mercado', 'Lanches e cafés', 'Compras', 'Beleza e cuidados', 'Transporte e combustível', 'Lazer e passeios', 'Roupas', 'Farmácia', 'Imprevistos', 'Outros'];

/* ---------- acesso por caminho "metas.0.t" ---------- */
export function getPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
/** Cópia imutável com o valor trocado; cria objetos ou listas no caminho. */
export function setPath(obj: any, path: string, val: any): any {
  const ks = path.split('.');
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let o: any = root;
  ks.forEach((k, i) => {
    if (i === ks.length - 1) {
      if (val === undefined) delete o[k];
      else o[k] = val;
      return;
    }
    const next = o[k];
    const nextIsIndex = /^\d+$/.test(ks[i + 1]);
    o[k] = Array.isArray(next) ? [...next] : next && typeof next === 'object' ? { ...next } : nextIsIndex ? [] : {};
    o = o[k];
  });
  return root;
}

export const uid = (p = 'x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

/* ---------- tarefas do dia ---------- */
export type Sub = { t: string; ok?: boolean };
/**
 * first: menor primeiro passo | est: minutos estimados | real: minutos que levou (timer)
 * en: energia que a tarefa pede (0 baixa, 1 média, 2 alta)
 */
export type Task = {
  time?: string; end?: string; t?: string; desc?: string; cat?: number; ok?: boolean; sub?: Sub[];
  first?: string; est?: number; real?: number; en?: number;
};
export const ENERGIA = ['baixa', 'média', 'alta'];
export const ENERGIA_ICON = ['battery-dead-outline', 'battery-half-outline', 'battery-full-outline'];
export type Rule = { id: string; t: string; time?: string; end?: string; desc?: string; cat?: number; days: number[]; from?: string };

export const rules = (docs: Docs): Rule[] => {
  const r = docs['t-rot']?.r;
  return Array.isArray(r) ? r.filter((x) => x && x.id) : [];
};
/** Tarefas fixas que valem para a data: dia da semana marcado e início <= data. */
export function rulesFor(docs: Docs, d: Date): Rule[] {
  const k = key(d);
  return rules(docs).filter((r) => (r.days || []).map(Number).includes(d.getDay()) && (!r.from || r.from <= k));
}

/** Tudo o que dá para marcar no dia, na ordem do modo foco: prioridades, depois por horário. */
export type QItem =
  | { kind: 'meta'; i: number; t: string; ok: boolean }
  | { kind: 'task'; i: number; task: Task; ok: boolean }
  | { kind: 'rule'; r: Rule; ok: boolean };

export function dayQueue(docs: Docs, d: Date): QItem[] {
  const doc = docs['d-' + key(d)] || {};
  const metas: QItem[] = [0, 1, 2]
    .map((i) => ({ i, m: doc.metas?.[i] }))
    .filter((x) => x.m && String(x.m.t || '').trim())
    .map((x) => ({ kind: 'meta' as const, i: x.i, t: String(x.m.t), ok: !!x.m.ok }));
  const timed: QItem[] = [
    ...(Array.isArray(doc.tl) ? doc.tl : []).map((t: Task, i: number) => ({ kind: 'task' as const, i, task: t || {}, ok: !!t?.ok })),
    ...rulesFor(docs, d).filter((r) => !doc.rs?.[r.id]).map((r) => ({ kind: 'rule' as const, r, ok: !!doc.rd?.[r.id] })),
  ];
  const tm = (x: QItem) => (x.kind === 'task' ? x.task.time : x.kind === 'rule' ? x.r.time : '') || '99';
  timed.sort((a, b) => tm(a).localeCompare(tm(b)));
  return [...metas, ...timed];
}

/* ---------- hábitos ---------- */
export type Habit = { id: string; n: string; cat?: number };
export const habits = (docs: Docs): Habit[] => {
  const l = docs['t-habs']?.hl;
  return Array.isArray(l) ? l.filter((x) => x && x.id) : [];
};
export const habOn = (docs: Docs, h: string, d: Date) => !!getPath(docs['m-' + mkey(d)], `hk.${h}.${d.getDate()}`);
/**
 * Sequência que perdoa: 1 dia de folga a cada 7 dias não zera a contagem.
 * Dois dias seguidos sem marcar, ou duas folgas em menos de 7 dias, encerram a sequência.
 */
export function streakInfo(docs: Docs, h: string) {
  const back = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate() - 1);
  let d = today();
  if (!habOn(docs, h, d)) d = back(d); // hoje ainda está em aberto
  let n = 0, folgas = 0, lastMiss: Date | null = null;
  for (let i = 0; i < 3660; i++) {
    if (habOn(docs, h, d)) n++;
    else {
      if (lastMiss && (lastMiss.getTime() - d.getTime()) / 864e5 < 7) break;
      if (!habOn(docs, h, back(d))) break;
      lastMiss = d;
      folgas++;
    }
    d = back(d);
  }
  return { n, folgas: n ? folgas : 0 };
}
export const streak = (docs: Docs, h: string) => streakInfo(docs, h).n;

/* ---------- resumo do dia (para o mês e o início) ---------- */
export function dayInfo(docs: Docs, d: Date) {
  const doc = docs['d-' + key(d)] || {};
  let total = 0, done = 0;
  const metas = doc.metas || {};
  Object.values(metas).forEach((m: any) => {
    if (m && String(m.t || '').trim()) { total++; if (m.ok) done++; }
  });
  (Array.isArray(doc.tl) ? doc.tl : []).forEach((t: Task) => {
    if (t && String(t.t || '').trim()) { total++; if (t.ok) done++; }
  });
  if (d <= today()) {
    rulesFor(docs, d).forEach((r) => {
      if (doc.rs?.[r.id]) return; // "não hoje"
      total++;
      if (doc.rd?.[r.id]) done++;
    });
  }
  // mood é guardado de 1 a 6 (0 = sem marcação)
  return { total, done, mood: Number(doc.mood || 0), water: Number(doc.water || 0) };
}

/* ---------- finanças ---------- */
export type Parc = { id: string; d: string; v: string; n: number; start: string; c?: string; total?: string };
export type Ox = { d?: string; t?: string; c?: string; v?: string; ok?: boolean };

const monthIdx = (mk: string) => { const [y, m] = mk.split('-').map(Number); return y * 12 + m - 1; };
export const parcList = (docs: Docs): Parc[] => {
  const l = docs['t-parc']?.l;
  return Array.isArray(l) ? l.filter((x) => x && x.id) : [];
};
export function parcOf(docs: Docs, d: Date) {
  const mi = d.getFullYear() * 12 + d.getMonth();
  return parcList(docs)
    .map((x) => ({ ...x, k: mi - monthIdx(x.start || mkey(d)) + 1 }))
    .filter((x) => x.k >= 1 && x.k <= (Number(x.n) || 1));
}
export const parcTotal = (docs: Docs, d: Date) => parcOf(docs, d).reduce((t, x) => t + num(x.v), 0);
export const oxList = (docs: Docs, d: Date): Ox[] => {
  const l = docs['f-' + mkey(d)]?.ox;
  return Array.isArray(l) ? l : [];
};
export const oxTotal = (docs: Docs, d: Date) => oxList(docs, d).reduce((t, x) => t + num(x?.v), 0);
export function endLabel(x: Parc) {
  const ABR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const e = monthIdx(x.start) + (Number(x.n) || 1) - 1;
  return `${ABR[e % 12]}/${String(Math.floor(e / 12)).slice(2)}`;
}

/** Gastos lançados nos dias do mês (campo "spend" de cada dia). */
export function daySpend(docs: Docs, d: Date) {
  const pre = 'd-' + mkey(d) + '-';
  let s = 0;
  Object.entries(docs).forEach(([id, doc]) => {
    if (!id.startsWith(pre)) return;
    Object.values(doc.spend || {}).forEach((x: any) => { s += num(x?.v); });
  });
  return s;
}

export function finSums(docs: Docs, d: Date) {
  const f = docs['f-' + mkey(d)] || {};
  let inc = 0, fix = 0, va = 0;
  Object.values(f.inc || {}).forEach((x: any) => { inc += num(x?.v); });
  FIXAS.forEach((_, i) => { fix += num(f.fix?.[i]?.v); });
  VARIA.forEach((_, i) => { va += num(f.var?.[i]?.v); });
  const pc = parcTotal(docs, d), ox = oxTotal(docs, d);
  return { inc, fix, va, pc, ox, out: fix + va + pc + ox, bal: inc - fix - va - pc - ox, goal: num(f.goal?.v), save: num(f.goal?.month), days: daySpend(docs, d) };
}

export const parseKey = fromKey;
