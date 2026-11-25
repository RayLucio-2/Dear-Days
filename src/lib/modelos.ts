/** Modelos de rotina saudável: pacotes de tarefas fixas e passos de manhã e noite para começar sem pensar. */
export type ModeloFixa = { t: string; time?: string; end?: string; days: number[]; cat?: number; desc?: string };
export type Pacote = { k: string; n: string; d: string; icon: string; itens: ModeloFixa[] };

const TODO = [0, 1, 2, 3, 4, 5, 6], UTEIS = [1, 2, 3, 4, 5];

export const PACOTES: Pacote[] = [
  { k: 'mover', n: 'Corpo em movimento', icon: 'walk-outline', d: 'Pouco, mas sempre. Mexer o corpo ajuda a focar e a dormir melhor.', itens: [
    { t: 'Caminhada de 20 minutos', time: '07:00', end: '07:20', days: [1, 3, 5], cat: 2, desc: 'Se não der de manhã, vale no fim da tarde.' },
    { t: 'Alongamento de 5 minutos', time: '21:00', end: '21:05', days: TODO, cat: 2 },
    { t: 'Treino ou aula que você gosta', time: '18:30', end: '19:15', days: [2, 4], cat: 2 },
  ] },
  { k: 'pausas', n: 'Pausas no trabalho', icon: 'cafe-outline', d: 'Pausas curtas para chegar ao fim do dia com energia.', itens: [
    { t: 'Pausa: água e alongar', time: '10:00', end: '10:05', days: UTEIS, cat: 0 },
    { t: 'Almoço longe da tela', time: '12:00', end: '13:00', days: UTEIS, cat: 3 },
    { t: 'Pausa de 5 minutos fora da tela', time: '15:30', end: '15:35', days: UTEIS, cat: 0 },
    { t: 'Fechar o dia: anotar o que ficou para amanhã', time: '18:00', end: '18:10', days: UTEIS, cat: 0 },
  ] },
  { k: 'sono', n: 'Dormir melhor', icon: 'moon-outline', d: 'Um caminho de desaceleração para o corpo entender que é hora de descansar.', itens: [
    { t: 'Jantar mais leve', time: '19:30', days: TODO, cat: 3 },
    { t: 'Desligar as telas', time: '22:00', days: TODO, cat: 1, desc: 'Luz mais baixa, celular carregando longe da cama.' },
    { t: 'Deitar para dormir', time: '22:30', days: TODO, cat: 1 },
  ] },
  { k: 'cuidar', n: 'Cuidar de mim', icon: 'heart-outline', d: 'Coisas pequenas que fazem bem e costumam ficar para depois.', itens: [
    { t: 'Ler 10 páginas', time: '21:30', end: '21:45', days: TODO, cat: 1 },
    { t: 'Falar com alguém querido', days: [6], cat: 1 },
    { t: 'Um tempo sem fazer nada, de propósito', days: [0], cat: 1 },
  ] },
  { k: 'domingo', n: 'Domingo de preparação', icon: 'calendar-outline', d: 'Meia hora no domingo que deixa a semana inteira mais leve.', itens: [
    { t: 'Lista de compras da semana', time: '17:00', end: '17:15', days: [0], cat: 3 },
    { t: 'Revisão da semana no Dear Days', time: '18:00', end: '18:15', days: [0], cat: 0 },
    { t: 'Separar roupa e bolsa de segunda', time: '20:00', end: '20:10', days: [0], cat: 0 },
  ] },
];

/** Opções de passos para a rotina da manhã e da noite. */
export const ROTINAS: Record<'manha' | 'noite', { n: string; passos: string[] }[]> = {
  manha: [
    { n: 'Manhã leve (10 min)', passos: ['Beber um copo de água', 'Abrir a janela e respirar fundo 3 vezes', 'Escovar os dentes', 'Olhar as 3 prioridades de hoje'] },
    { n: 'Manhã com movimento', passos: ['Beber um copo de água', 'Alongar por 5 minutos', 'Café da manhã com proteína', 'Arrumar a cama', 'Olhar as 3 prioridades de hoje'] },
    { n: 'Manhã sem celular', passos: ['Não pegar o celular nos primeiros 20 minutos', 'Beber um copo de água', 'Tomar banho', 'Café da manhã com calma, sem tela', 'Só então abrir o Dear Days'] },
  ],
  noite: [
    { n: 'Noite para dormir melhor', passos: ['Escolher as 3 prioridades de amanhã', 'Desligar as telas', 'Banho morno', 'Celular carregando longe da cama', 'Ler um pouco'] },
    { n: 'Noite organizada (10 min)', passos: ['Esvaziar a caixa de entrada', 'Escolher as prioridades de amanhã', 'Separar a roupa de amanhã', 'Deixar a cozinha arrumada'] },
    { n: 'Noite para desacelerar', passos: ['Anotar como foi o dia em uma frase', 'Alongar por 5 minutos', 'Luz baixa', 'Respirar fundo 5 vezes antes de dormir'] },
  ],
};
