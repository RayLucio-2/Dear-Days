/**
 * Potinho do mês: cada coisa feita vira uma bolinha colorida no pote.
 * Nunca esvazia e nunca tira bolinha: só mostra o que você já fez.
 */
import { key, mkey } from './dates';
import { Docs, habits, HAB_CORES } from './planner';

export type Bolinha = { cor: string; tipo: 'tarefa' | 'habito' | 'prioridade' };

export function bolinhasDoMes(docs: Docs, mes: Date): Bolinha[] {
  const y = mes.getFullYear(), m = mes.getMonth();
  const n = new Date(y, m + 1, 0).getDate();
  const out: Bolinha[] = [];
  const corTarefa = HAB_CORES[0].c[2], corMeta = HAB_CORES[2].c[2];
  for (let i = 1; i <= n; i++) {
    const doc = docs['d-' + key(new Date(y, m, i))];
    if (!doc) continue;
    Object.values(doc.metas || {}).forEach((x: any) => { if (x?.ok && x?.t) out.push({ cor: corMeta, tipo: 'prioridade' }); });
    (Array.isArray(doc.tl) ? doc.tl : []).forEach((t: any) => { if (t?.ok && t?.t) out.push({ cor: corTarefa, tipo: 'tarefa' }); });
    Object.values(doc.rd || {}).forEach((v) => { if (v) out.push({ cor: corTarefa, tipo: 'tarefa' }); });
  }
  const hk = docs['m-' + mkey(mes)]?.hk || {};
  habits(docs).forEach((h: any) => {
    const cor = HAB_CORES[(typeof h.cor === 'number' ? h.cor : [1, 0, 5, 4][h.cat || 0]) % HAB_CORES.length].c[2];
    Object.values(hk[h.id] || {}).forEach((v) => { if (v) out.push({ cor, tipo: 'habito' }); });
  });
  // mistura de um jeito sempre igual (para o pote não "pular" a cada abertura)
  return out.map((b, i) => ({ b, k: (i * 2654435761) % 1000 })).sort((a, z) => a.k - z.k).map((x) => x.b);
}

/** Frase gentil conforme o pote enche. */
export function frasePote(n: number) {
  if (n === 0) return 'Cada coisa que você fizer vira uma bolinha aqui. Começa com uma.';
  if (n < 10) return 'O pote começou a encher. Cada bolinha conta.';
  if (n < 40) return 'Olha quanta coisa você já fez este mês.';
  if (n < 80) return 'Seu pote está ficando cheio de cor.';
  return 'Pote cheio! Um mês inteiro de cuidado com você.';
}
