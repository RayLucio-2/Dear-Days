/** Ferramentas e listas que vieram do planner web (mesmos ids de docs). */
export const AREAS = ['Saúde', 'Cabeça e emoções', 'Relacionamentos', 'Família', 'Trabalho', 'Estudos', 'Dinheiro', 'Descanso e lazer', 'Casa', 'Espiritualidade'];

export type ToolKey =
  | 'prefacio' | 'pilares' | 'roda' | 'metas5' | 'plano' | 'sentir' | 'hobbies'
  | 'sonhos' | 'leituras' | 'memorias' | 'reflexao' | 'carta' | 'notas' | 'escrita';

export const TOOLS: { k: ToolKey; n: string; icon: string; sub: string }[] = [
  { k: 'prefacio', n: 'Prefácio', icon: 'book-outline', sub: 'Como usar este planner, e por que você está começando.' },
  { k: 'pilares', n: 'Pilares', icon: 'business-outline', sub: 'Os valores que sustentam suas escolhas. Comece com três e chegue a cinco se quiser.' },
  { k: 'roda', n: 'Roda da vida', icon: 'aperture-outline', sub: 'Dê uma nota de 0 a 10 para cada área. A roda muda enquanto você ajusta.' },
  { k: 'metas5', n: 'Metas para 5 anos', icon: 'trophy-outline', sub: 'Onde você quer estar daqui a 5 anos, área por área. Não precisa preencher todas.' },
  { k: 'plano', n: 'Plano de vida', icon: 'diamond-outline', sub: 'Três áreas da vida que merecem mais atenção agora, com um objetivo para cada.' },
  { k: 'sentir', n: 'Do sentir à ação', icon: 'moon-outline', sub: 'Nomeie o que sente, entenda o que isso pede e escolha uma ação pequena.' },
  { k: 'hobbies', n: 'Hobbies', icon: 'star-outline', sub: 'O que você faz por prazer, sem obrigação. Anote quando foi a última vez.' },
  { k: 'sonhos', n: 'Meu top 3 de sonhos', icon: 'grid-outline', sub: 'Os três sonhos que mais importam agora, e o primeiro passo de cada um.' },
  { k: 'leituras', n: 'Diário de leituras', icon: 'library-outline', sub: 'Os livros que você leu ou está lendo.' },
  { k: 'memorias', n: 'Memórias do ano', icon: 'heart-outline', sub: 'Um lugar para guardar o que fez cada mês valer a pena.' },
  { k: 'reflexao', n: 'Reflexão semestral', icon: 'sparkles-outline', sub: 'Faça com calma, no fim de junho e no fim de dezembro.' },
  { k: 'carta', n: 'Carta para o eu do futuro', icon: 'mail-outline', sub: 'Para ser escrita no fim do ano. Abra de novo daqui a um ano.' },
  { k: 'notas', n: 'Notas rápidas', icon: 'document-text-outline', sub: 'Para tirar da cabeça rápido. Organize depois.' },
  { k: 'escrita', n: 'Escrita terapêutica', icon: 'create-outline', sub: 'Um convite por dia para escrever sobre o que sente. Sem regras, sem certo ou errado.' },
];
export const toolOf = (k: string) => TOOLS.find((t) => t.k === k);

export const PROMPTS = [
  'O que está ocupando mais espaço na minha cabeça hoje?', 'Do que eu preciso agora e ainda não pedi?',
  'Qual foi o momento mais leve desta semana?', 'O que eu diria para mim mesma se fosse minha melhor amiga?',
  'Que limite eu gostaria de colocar e por quê?', 'O que me deixou orgulhosa recentemente, mesmo que pequeno?',
  'O que estou evitando sentir?', 'Pelo que sou grata hoje, de verdade?', 'Se o dia de hoje fosse um título de livro, qual seria?',
  'O que eu posso soltar esta semana?', 'Onde meu corpo está pedindo atenção?', 'Como seria um dia bom para mim, do começo ao fim?',
  'Que hábito antigo eu quero deixar ir?', 'O que eu aprendi com a última coisa difícil que vivi?',
];
/** Mesmo cálculo do web: dia do ano, módulo o número de convites. */
export const promptOf = (d: Date) => PROMPTS[Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5) % PROMPTS.length];

/** Semestres da reflexão (os mesmos ids do web, mais os próximos). */
export function semestres(now = new Date()) {
  const out: [string, string][] = [];
  for (let y = 2026; y <= Math.max(2027, now.getFullYear() + 1); y++) {
    for (const s of [1, 2]) {
      if (y === 2026 && s === 1) continue;
      out.push([`${y}-${s}`, `${s}º semestre de ${y}`]);
    }
  }
  return out;
}
