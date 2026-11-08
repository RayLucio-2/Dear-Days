/** Converte "1.250,90", "1250.9" ou "R$ 30" em número. Vazio vira 0. */
export function num(s: unknown): number {
  let t = String(s ?? '').trim().replace(/[^\d,.\-]/g, '');
  if (!t) return 0;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); // "1.100" = mil e cem
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
}

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** 120 -> "120,00" (como o planner guarda os valores digitados). */
export const toBR = (n: number) => n.toFixed(2).replace('.', ',');
