/** Atalhos de finanças: lançar gasto e entrada com um toque e listar o que falta pagar. */
import { useStore } from './store';
import { key, mkey } from './dates';
import { num, toBR } from './money';
import { Docs, FIXAS, parcOf, oxList, VARIA } from './planner';

/** Soma o gasto na categoria do mês (o resumo continua igual) e guarda no histórico (gl). */
export function addGasto(dia: Date, valor: number, cat: number, desc: string) {
  const { get, set, push } = useStore.getState();
  const id = 'f-' + mkey(dia);
  const atual = num(get(id, `var.${cat}.v`));
  set(id, `var.${cat}.v`, toBR(atual + valor));
  push(id, 'gl', { d: key(dia), t: desc.trim() || VARIA[cat], v: toBR(valor), c: cat, tipo: 'gasto' });
}

/** Coloca a entrada na primeira linha livre de Entradas (ou soma na última). */
export function addEntrada(dia: Date, valor: number, desc: string) {
  const { get, set, push } = useStore.getState();
  const id = 'f-' + mkey(dia);
  const inc = get(id, 'inc') || {};
  let i = [0, 1, 2, 3, 4, 5].find((k) => !num(inc?.[k]?.v) && !String(inc?.[k]?.t ?? '').trim());
  if (i === undefined) {
    i = 5;
    set(id, `inc.5.v`, toBR(num(inc?.[5]?.v) + valor));
    if (!String(inc?.[5]?.t ?? '').includes('outras')) set(id, 'inc.5.t', `${inc?.[5]?.t || 'Entradas'} e outras`);
  } else {
    set(id, `inc.${i}.t`, desc.trim() || 'Entrada');
    set(id, `inc.${i}.v`, toBR(valor));
  }
  push(id, 'gl', { d: key(dia), t: desc.trim() || 'Entrada', v: toBR(valor), tipo: 'entrada' });
}

export type Pendente = { k: string; t: string; sub: string; v: number; doc: string; path: string };

/** Contas do mês ainda não marcadas como pagas: fixas, parcelas e outras despesas. */
export function pendentes(docs: Docs, d: Date): Pendente[] {
  const id = 'f-' + mkey(d);
  const f = docs[id] || {};
  const out: Pendente[] = [];
  FIXAS.forEach((n, i) => {
    const v = num(f.fix?.[i]?.v);
    if (v && !f.fix?.[i]?.ok) out.push({ k: 'fix' + i, t: n, sub: 'conta fixa', v, doc: id, path: `fix.${i}.ok` });
  });
  parcOf(docs, d).forEach((x) => {
    if (!f.pp?.[x.id]) out.push({ k: 'pc' + x.id, t: x.d || 'Parcela', sub: `parcela ${x.k} de ${x.n}`, v: num(x.v), doc: id, path: `pp.${x.id}` });
  });
  oxList(docs, d).forEach((x, i) => {
    if (x && num(x.v) && !x.ok) out.push({ k: 'ox' + i, t: x.t || 'Despesa', sub: x.d ? `dia ${String(x.d).slice(8, 10)}/${String(x.d).slice(5, 7)}` : 'outra despesa', v: num(x.v), doc: id, path: `ox.${i}.ok` });
  });
  return out;
}

/** Histórico de lançamentos rápidos do mês (mais novo primeiro). */
export function historico(docs: Docs, d: Date) {
  const l = docs['f-' + mkey(d)]?.gl;
  return (Array.isArray(l) ? l : []).filter(Boolean).slice().reverse() as { d: string; t: string; v: string; c?: number; tipo: 'gasto' | 'entrada' }[];
}
