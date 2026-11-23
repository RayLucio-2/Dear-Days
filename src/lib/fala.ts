/**
 * Entende o que a pessoa escreve do jeito que fala, sem inteligência artificial (roda no aparelho):
 *  "dentista amanhã 15h"        -> tarefa amanhã às 15:00
 *  "reunião sexta às 9:30"      -> tarefa na próxima sexta
 *  "gastei 32 no mercado"       -> gasto de R$ 32,00 em Mercado
 *  "recebi 1.200 do freela"     -> entrada de R$ 1.200,00
 *  qualquer outra coisa          -> caixa de entrada
 */
import { addDays, key, today } from './dates';
import { num } from './money';

/** Palavras que ajudam a achar a categoria do gasto (índices de VARIA em planner.ts). */
const OUTROS = 9;
const PISTAS: [number, RegExp][] = [
  [0, /mercad|supermerc|feira|hortifr|a[çc]ougue|padaria/i],
  [1, /lanche|caf[eé]|ifood|delivery|pizza|hamb[uú]rguer|sorvete|almo[çc]o|jantar|restaurante/i],
  [3, /sal[aã]o|unha|cabelo|manicure|beleza|maquiagem|skincare|perfume/i],
  [4, /uber|\b99\b|[oô]nibus|gasolina|combust[ií]vel|estacionamento|metr[oô]|passagem|t[aá]xi/i],
  [5, /cinema|show|passeio|\bbar\b|viagem|lazer|ingresso/i],
  [6, /roupa|sapato|t[eê]nis|blusa|cal[çc]a|vestido/i],
  [7, /farm[aá]cia|rem[eé]dio|drogaria/i],
  [2, /compra|loja|shopee|amazon|mercado ?livre|shein/i],
];
export function categoriaDe(texto: string) {
  const achou = PISTAS.find(([, re]) => re.test(texto));
  return achou ? achou[0] : OUTROS;
}

export type Entendido =
  | { tipo: 'gasto'; valor: number; desc: string; cat: number; dia: Date }
  | { tipo: 'entrada'; valor: number; desc: string; dia: Date }
  | { tipo: 'tarefa'; t: string; dia: Date; hora: string }
  | { tipo: 'nada' };

/** \b que entende acentos (o \b normal acha que "ã" não é letra). */
const B = '(?:(?<![\\p{L}\\p{N}_])(?=[\\p{L}\\p{N}_])|(?<=[\\p{L}\\p{N}_])(?![\\p{L}\\p{N}_]))';
const re = (src: string, f = 'i') => new RegExp(src.replace(/\\b/g, B), f + 'u');

const DIAS = ['domingo', 'segunda', 'ter[çc]a', 'quarta', 'quinta', 'sexta', 's[áa]bado'];
const VALOR = /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|conto|pila)?/i;
const limpa = (s: string) => s.replace(/\s{2,}/g, ' ').replace(/^[\s,.\-:]+|[\s,.\-:]+$/g, '').trim();
const capital = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function quando(txt: string): { dia: Date | null; resto: string } {
  let t = ' ' + txt + ' ';
  const hoje = today();
  let dia: Date | null = null;
  const tira = (re: RegExp) => { t = t.replace(re, ' '); };
  if (re(String.raw`\bontem\b`).test(t)) { dia = addDays(hoje, -1); tira(re(String.raw`\bontem\b`)); }
  else if (re(String.raw`\bdepois de amanh[ãa]\b`, 'i').test(t)) { dia = addDays(hoje, 2); tira(re(String.raw`\bdepois de amanh[ãa]\b`, 'i')); }
  else if (re(String.raw`\bamanh[ãa]\b`, 'i').test(t)) { dia = addDays(hoje, 1); tira(re(String.raw`\bamanh[ãa]\b`, 'i')); }
  else if (re(String.raw`\bhoje\b`, 'i').test(t)) { dia = hoje; tira(re(String.raw`\bhoje\b`, 'i')); }
  else {
    const dm = re(String.raw`\b(?:dia\s+)?(\d{1,2})\/(\d{1,2})\b`, 'i').exec(t) || re(String.raw`\bdia\s+(\d{1,2})\b`, 'i').exec(t);
    if (dm) {
      const d = Number(dm[1]), m = dm[2] ? Number(dm[2]) - 1 : hoje.getMonth();
      let x = new Date(hoje.getFullYear(), m, d);
      if (key(x) < key(hoje)) x = dm[2] ? new Date(hoje.getFullYear() + 1, m, d) : new Date(hoje.getFullYear(), m + 1, d);
      if (x.getDate() === d) { dia = x; tira(new RegExp(dm[0].replace('/', '\\/'), 'i')); }
    } else {
      DIAS.forEach((n, i) => {
        if (dia) return;
        const rx = re(String.raw`\b(?:na |no |nesta |neste |pr[óo]xim[ao] )?` + n + String.raw`(?:-feira)?\b`);
        if (rx.test(t)) {
          const dif = (i - hoje.getDay() + 7) % 7 || 7;
          dia = addDays(hoje, dif);
          tira(rx);
        }
      });
    }
  }
  return { dia, resto: t };
}

function hora(txt: string): { hora: string; resto: string } {
  const m = re(String.raw`\b(?:[àa]s?\s+)?(\d{1,2})(?:(?::|h)(\d{2})|h|\s*horas?)\b`, 'i').exec(txt) || re(String.raw`\b[àa]s\s+(\d{1,2})\b`, 'i').exec(txt);
  if (!m) return { hora: '', resto: txt };
  const h = Number(m[1]), mi = Number(m[2] || 0);
  if (h > 23 || mi > 59) return { hora: '', resto: txt };
  return { hora: `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`, resto: txt.replace(m[0], ' ') };
}

export function entender(texto: string): Entendido {
  const txt = texto.trim();
  if (!txt) return { tipo: 'nada' };

  // Dinheiro: precisa de um verbo de gasto/entrada E de um valor
  const gasto = re(String.raw`\b(gastei|paguei|comprei|gasto|paguei)\b`, 'i').exec(txt);
  const entrada = re(String.raw`\b(recebi|ganhei|entrou|caiu|vendi)\b`, 'i').exec(txt);
  const v = VALOR.exec(txt.replace(re(String.raw`\b\d{1,2}\/\d{1,2}\b`, 'g'), ''));
  if ((gasto || entrada) && v && num(v[1]) > 0) {
    const { dia, resto } = quando(txt);
    const desc = capital(limpa(resto.replace(v[0], ' ').replace(re(String.raw`\b(gastei|paguei|comprei|gasto|recebi|ganhei|entrou|caiu|vendi)\b`, 'gi'), ' ')
      .replace(/^\s*(no|na|nos|nas|de|do|da|com|em|pra|para|pro)\s+/i, ' ').replace(/\s(no|na|de|do|da|com|em|pra|para|pro)\s*$/i, ' ')));
    const d = dia ?? today();
    if (gasto && (!entrada || gasto.index < entrada.index)) return { tipo: 'gasto', valor: num(v[1]), desc, cat: categoriaDe(txt), dia: d };
    return { tipo: 'entrada', valor: num(v[1]), desc, dia: d };
  }

  // Tarefa: precisa de um dia ou de uma hora
  const q = quando(txt);
  const h = hora(q.resto);
  if (q.dia || h.hora) {
    const t = capital(limpa(h.resto.replace(/\s(no|na|de|em|para|pra)\s*$/i, ' ')));
    if (t) return { tipo: 'tarefa', t, dia: q.dia ?? today(), hora: h.hora };
  }
  return { tipo: 'nada' };
}
