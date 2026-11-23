/**
 * Personalizar: mesmo formato do planner antigo, em t-cfg.
 *   theme  "mes" | "rosa" | ... | "custom"     custom  "#8A6579"
 *   tabs   ["dia","semana",...]  (abas, na ordem)
 *   home   ["hoje","tarefas",...] (blocos do Início, na ordem)
 *   fav    ["dia","mes",...]      (atalhos do Início, até 6)
 *   app.start "inicio" | "dia" | "foco"  (tela que abre primeiro; só do app)
 */
export const THEMES: [string, string, [string, string] | null][] = [
  ['mes', 'Cor de cada mês', null], ['rosa', 'Rosa', ['#EFD6D7', '#A2656A']], ['lilas', 'Lilás', ['#DFD7EA', '#7A6B98']],
  ['azul', 'Azul', ['#D3DEE9', '#5C7894']], ['verde', 'Verde', ['#D5E1D0', '#66855F']], ['menta', 'Menta', ['#CCE3DF', '#55877F']],
  ['areia', 'Areia', ['#F1DCC2', '#9C7642']], ['pessego', 'Pêssego', ['#F3DACA', '#A86C4B']], ['malva', 'Malva', ['#E7D3DE', '#8A6579']],
  ['cinza', 'Cinza', ['#DEDAD5', '#6B635B']],
];
export const CUSTOM_SWATCHES = ['#B5536B', '#C27C4E', '#4E7F9C', '#3F7D6B', '#7A5C99', '#2F2B27'];

export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
export const isHex = (s: unknown) => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);

/** Par [claro, forte] escolhido, ou null para usar a cor de cada mês. */
export function themePair(cfg: any): [string, string] | null {
  const th = cfg?.theme;
  if (th === 'custom' && isHex(cfg?.custom)) return [mixHex(cfg.custom, '#ffffff', 0.72), mixHex(cfg.custom, '#000000', 0.12)];
  const f = THEMES.find((x) => x[0] === th);
  return f && f[2] ? f[2] : null;
}

/** Páginas que podem virar aba (rota no app). */
export const TAB_VIEWS: [string, string][] = [
  ['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês'], ['habitos', 'Hábitos'], ['financas', 'Finanças'],
  ['emocoes', 'Emoções'], ['graficos', 'Gráficos'], ['ano', 'Plano do ano'], ['rotina', 'Tarefas fixas'],
  ['sono', 'Sono'], ['compras', 'Lista de compras'], ['parar', 'Quero parar'],
];
export const DEF_TABS = ['dia', 'mes', 'habitos', 'financas', 'semana', 'emocoes', 'graficos'];
/** No celular cabem Início + 4 abas + Mais. */
export const MOBILE_TABS = 4;

export const HOME_BLOCKS: [string, string][] = [
  ['hoje', 'Resumo de hoje'], ['potinho', 'Potinho do mês'], ['atalhos', 'Atalhos'], ['caixa', 'Caixa de entrada e revisão'], ['tarefas', 'Tarefas de hoje'],
  ['habitos', 'Hábitos e água'], ['metas', 'Metas do mês'], ['financas', 'Finanças do mês'], ['emocoes', 'Emoções do mês'],
  ['ferramentas', 'Ferramentas'], ['backup', 'Cópia de segurança'],
];
export const DEF_HOME = ['hoje', 'potinho', 'caixa', 'tarefas', 'habitos', 'metas', 'financas'];

/** Atalhos: páginas e ferramentas que podem virar cartão no Início. */
export const FAV_VIEWS: [string, string, string][] = [
  ['dia', 'Dia', 'Tarefas, prioridades e horários de hoje'], ['semana', 'Semana', 'Compromissos da semana'],
  ['mes', 'Mês', 'Calendário, metas e notas'], ['habitos', 'Hábitos', 'Marque os hábitos de hoje'],
  ['financas', 'Finanças', 'Entradas, saídas e resultado'], ['emocoes', 'Emoções', 'Como você se sentiu no mês'],
  ['graficos', 'Gráficos', 'Seu mês em gráficos'], ['rotina', 'Tarefas fixas', 'O que se repete todo dia'],
  ['ano', 'Plano do ano', 'Palavra e metas do ano'], ['roda', 'Roda da vida', 'Notas de cada área da vida'],
  ['leituras', 'Diário de leituras', 'Livros e comentários'], ['notas', 'Notas rápidas', 'Para tirar da cabeça'],
  ['escrita', 'Escrita terapêutica', 'Um convite por dia'], ['memorias', 'Memórias do ano', 'O que fez cada mês valer'],
  ['sonhos', 'Top 3 de sonhos', 'E o primeiro passo de cada um'], ['pilares', 'Pilares', 'Seus valores'],
  ['sono', 'Sono', 'Quanto você dormiu'], ['compras', 'Lista de compras', 'Mercado por seção'], ['parar', 'Quero parar', 'Dias sem e quanto economizou'],
];
export const DEF_FAV = ['dia', 'mes', 'emocoes', 'financas'];
export const MAX_FAV = 6;

export const START_OPTS: [string, string][] = [['inicio', 'Início'], ['dia', 'Dia completo'], ['foco', 'Modo foco']];

export const listOf = (cfg: any, k: 'tabs' | 'home' | 'fav', def: string[]) => (Array.isArray(cfg?.[k]) ? (cfg[k] as string[]).slice() : def.slice());

/** Rota para abrir uma página ou ferramenta. */
const TOOL_KEYS = ['roda', 'leituras', 'notas', 'escrita', 'memorias', 'sonhos', 'pilares', 'plano', 'sentir', 'hobbies', 'metas5', 'reflexao', 'carta', 'prefacio'];
export const hrefOf = (v: string): any => (TOOL_KEYS.includes(v) ? { pathname: '/ferramenta', params: { k: v } } : '/' + v);
