/**
 * Lê extrato bancário e fatura de cartão nos formatos que os bancos exportam: OFX e CSV.
 * Tudo acontece no aparelho. Nenhum arquivo é enviado para o servidor.
 */
import { categoriaDe } from './fala';

export type Tipo = 'extrato' | 'fatura';
export type Lanc = {
  id: string; // identificador para não importar duas vezes
  data: string; // AAAA-MM-DD
  desc: string;
  valor: number; // positivo = saiu (gasto), negativo = entrou (entrada ou estorno)
  cat: number;
  incluir: boolean;
  aviso?: string; // por que veio desmarcado ou o que é
};
export type Lido = { tipo: Tipo; banco?: string; itens: Lanc[]; formato: 'OFX' | 'CSV' };

/** Contas que costumam já estar em "Contas fixas": vêm desmarcadas para não contar duas vezes. */
const FIXA = /aluguel|condom[ií]nio|energia|enel|equatorial|cemig|copel|light\b|saneago|sabesp|[áa]gua e esgoto|internet|vivo|claro|tim\b|oi fibra|academia|smart ?fit|financiamento|seguro|netflix|spotify|disney|amazon prime|hbo|max\b|youtube premium|icloud|google one/i;
/** Movimentos entre contas ou da própria fatura: não são gasto nem renda. */
const PAGFATURA = /pagamento (de |da )?fatura|pagto fatura|pag fatura|pagamento recebido|pgto cart[aã]o|fatura cart[aã]o|resgate|aplica[çc][aã]o|transfer[eê]ncia entre contas|saldo anterior|saldo do dia|^saldo/i;

const limpa = (s: string) => s.replace(/\s+/g, ' ').trim();
const cap = (s: string) => s.toLowerCase().replace(/(^|\s|-)(\p{L})/gu, (_m, a, b) => a + b.toUpperCase());

/** "1.234,56" / "-1234.56" / "R$ 12,00" -> número */
export function numero(s: string) {
  let t = String(s ?? '').replace(/[R$\s]/g, '').replace(/[−–]/g, '-');
  const neg = /^\(.*\)$/.test(t) || /-$/.test(t);
  t = t.replace(/[()]/g, '').replace(/-$/, '');
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else t = t.replace(/,/g, '');
  const n = parseFloat(t);
  return isNaN(n) ? NaN : neg ? -Math.abs(n) : n;
}
/** 25/11/2026, 25/11/26, 2026-11-25, 20261125 -> AAAA-MM-DD */
export function dataISO(s: string) {
  const t = String(s ?? '').trim();
  let m = /^(\d{4})-?(\d{2})-?(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(t);
  if (m) {
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return '';
}

function marcar(l: Omit<Lanc, 'cat' | 'incluir'>, tipo: Tipo): Lanc {
  const desc = limpa(l.desc);
  let incluir = true, aviso: string | undefined;
  if (PAGFATURA.test(desc)) { incluir = false; aviso = tipo === 'fatura' ? 'pagamento da fatura' : 'movimento entre contas ou fatura'; }
  else if (tipo === 'fatura' && l.valor < 0) { incluir = false; aviso = 'estorno ou crédito'; }
  else if (FIXA.test(desc) && l.valor > 0) { incluir = false; aviso = 'parece conta fixa'; }
  const parc = /(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})\b/i.exec(desc);
  if (incluir && parc && Number(parc[2]) > 1 && Number(parc[1]) <= Number(parc[2])) aviso = `parcela ${Number(parc[1])} de ${Number(parc[2])}`;
  return { ...l, desc: cap(desc) || 'Sem descrição', cat: categoriaDe(desc), incluir, aviso };
}

/* ---------------- OFX ---------------- */
function tag(bloco: string, nome: string) {
  const m = new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i').exec(bloco);
  return m ? m[1].trim() : '';
}
function lerOFX(txt: string): Lido {
  const tipo: Tipo = /<CREDITCARDMSGSRSV1>|<CCSTMTRS>/i.test(txt) ? 'fatura' : 'extrato';
  const banco = tag(txt, 'ORG') || undefined;
  const itens = txt.split(/<STMTTRN>/i).slice(1).map((b) => {
    const bloco = b.split(/<\/STMTTRN>/i)[0];
    const amt = numero(tag(bloco, 'TRNAMT'));
    const data = dataISO(tag(bloco, 'DTPOSTED'));
    const desc = [tag(bloco, 'NAME'), tag(bloco, 'MEMO')].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(' ');
    const fit = tag(bloco, 'FITID');
    // No OFX: negativo = saiu. Na fatura, compras também vêm negativas na maioria dos bancos.
    const valor = -amt;
    return { id: fit ? `ofx:${fit}` : `h:${data}|${amt}|${desc}`, data, desc, valor };
  }).filter((x) => x.data && !isNaN(x.valor) && x.valor !== 0);
  return { tipo, banco, formato: 'OFX', itens: itens.map((x) => marcar(x, tipo)) };
}

/* ---------------- CSV ---------------- */
function linhasCSV(txt: string) {
  const prim = txt.split(/\r?\n/).find((l) => l.trim()) ?? '';
  const sep = (prim.match(/;/g)?.length ?? 0) > (prim.match(/,/g)?.length ?? 0) ? ';' : (prim.match(/\t/g)?.length ?? 0) > 1 ? '\t' : ',';
  const out: string[][] = [];
  for (const linha of txt.split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const cols: string[] = [];
    let cur = '', q = false;
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i];
      if (c === '"') { if (q && linha[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === sep && !q) { cols.push(cur); cur = ''; }
      else cur += c;
    }
    cols.push(cur);
    out.push(cols.map((x) => x.trim()));
  }
  return out;
}
const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function lerCSV(txt: string, nome: string): Lido {
  const rows = linhasCSV(txt.replace(/^﻿/, ''));
  // acha a linha de cabeçalho (alguns bancos põem umas linhas de título antes)
  let h = rows.findIndex((r) => r.some((c) => /^(data|date|dt)/.test(sem(c))) && r.some((c) => /(valor|amount|value|quantia)/.test(sem(c))));
  if (h < 0) h = 0;
  const head = rows[h].map(sem);
  const idx = (re: RegExp) => head.findIndex((c) => re.test(c));
  const iData = idx(/^(data|date|dt)/);
  const iDesc = idx(/(descri|title|titulo|historico|lancamento|estabelecimento|memo|detalhe)/);
  const iValor = idx(/(valor|amount|value|quantia)/);
  const iEnt = idx(/(credito|entrada)/), iSai = idx(/(debito|saida)/);
  const iId = idx(/(identificador|id$|fitid|documento)/);
  const ehFatura = /fatura|cart|card|nubank_20/i.test(nome) || head.includes('title') || (iEnt < 0 && iSai < 0 && rows.slice(h + 1).every((r) => numero(r[iValor]) >= 0 || /pagamento/i.test(r[iDesc] ?? '')));
  const tipo: Tipo = ehFatura ? 'fatura' : 'extrato';
  const itens = rows.slice(h + 1).map((r, n) => {
    const data = dataISO(r[iData] ?? '');
    const desc = (iDesc >= 0 ? r[iDesc] : r.filter((_, i) => i !== iData && i !== iValor).join(' ')) ?? '';
    let v: number;
    if (iValor >= 0) v = numero(r[iValor]);
    else v = (numero(r[iEnt]) || 0) - (numero(r[iSai]) || 0);
    // Extrato: positivo = entrou. Fatura: positivo = compra.
    const valor = tipo === 'fatura' ? v : -v;
    const id = iId >= 0 && r[iId] ? `csv:${r[iId]}` : `h:${data}|${v}|${desc}|${n}`;
    return { id, data, desc, valor };
  }).filter((x) => x.data && !isNaN(x.valor) && x.valor !== 0);
  return { tipo, formato: 'CSV', itens: itens.map((x) => marcar(x, tipo)) };
}

/** Descobre o formato e lê. Lança erro com mensagem em português se não der. */
export function lerArquivo(txt: string, nome = ''): Lido {
  if (/<OFX>|OFXHEADER|<STMTTRN>/i.test(txt)) return lerOFX(txt);
  if (/%PDF/.test(txt.slice(0, 1024))) throw new Error('Esse arquivo é PDF. No app ou site do banco, procure "Exportar" e escolha OFX, CSV ou Excel/planilha.');
  const r = lerCSV(txt, nome);
  if (!r.itens.length) throw new Error('Não encontrei lançamentos nesse arquivo. Ele precisa ter colunas de data, descrição e valor.');
  return r;
}

/** Ajusta o tipo (extrato/fatura) depois de lido, se a pessoa trocar. */
export function trocarTipo(l: Lido, tipo: Tipo): Lido {
  if (l.tipo === tipo) return l;
  return { ...l, tipo, itens: l.itens.map((x) => marcar({ id: x.id, data: x.data, desc: x.desc, valor: l.formato === 'CSV' ? -x.valor : x.valor }, tipo)) };
}

/** Decodifica bytes do arquivo (UTF-8 ou o padrão antigo dos bancos, Windows-1252). */
export function decodificar(buf: ArrayBuffer) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch { return new TextDecoder('windows-1252').decode(buf); }
}
