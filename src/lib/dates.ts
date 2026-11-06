export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const ABR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const DIASL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export const pad = (n: number) => String(n).padStart(2, '0');
/** 2026-11-04 */
export const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** 2026-11 */
export const mkey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const fromKey = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const sunday = (d: Date) => addDays(d, -d.getDay());
export const today = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
export const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
function easter(y: number) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

const cache: Record<number, Record<string, string>> = {};
/** Feriados nacionais (e Carnaval / Corpus Christi, pontos facultativos muito usados). */
export function holidays(y: number): Record<string, string> {
  if (cache[y]) return cache[y];
  const p = easter(y);
  const list: [Date, string][] = [
    [new Date(y, 0, 1), 'Ano Novo'],
    [addDays(p, -48), 'Carnaval'],
    [addDays(p, -47), 'Carnaval'],
    [addDays(p, -2), 'Sexta-feira Santa'],
    [new Date(y, 3, 21), 'Tiradentes'],
    [new Date(y, 4, 1), 'Dia do Trabalho'],
    [addDays(p, 60), 'Corpus Christi'],
    [new Date(y, 8, 7), 'Independência'],
    [new Date(y, 9, 12), 'Nossa Senhora Aparecida'],
    [new Date(y, 10, 2), 'Finados'],
    [new Date(y, 10, 15), 'Proclamação da República'],
    [new Date(y, 10, 20), 'Consciência Negra'],
    [new Date(y, 11, 25), 'Natal'],
  ];
  cache[y] = Object.fromEntries(list.map(([d, n]) => [key(d), n]));
  return cache[y];
}
export const holiday = (d: Date) => holidays(d.getFullYear())[key(d)];

/** "08:30" -> minutos desde a meia-noite (ou null). */
export function minutes(s?: string | null) {
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  return isNaN(h) ? null : h * 60 + (m || 0);
}
