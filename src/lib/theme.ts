/**
 * Cores do Dear Days. O modo (claro, escuro ou automático) é lido uma vez, quando o app abre:
 * todas as telas montam os estilos com estas cores. Ao trocar o modo, o app recarrega.
 */
import { Appearance, Platform } from 'react-native';

export type Tema = 'auto' | 'claro' | 'escuro';
const KEY = 'dd-tema';

function lerTema(): Tema {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    if (Platform.OS !== 'web') require('expo-sqlite/localStorage/install');
    const v = (globalThis as any).localStorage?.getItem(KEY);
    return v === 'claro' || v === 'escuro' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export const TEMA: Tema = lerTema();
export const DARK = TEMA === 'escuro' || (TEMA === 'auto' && Appearance.getColorScheme() === 'dark');

const CLARO = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  ink: '#2F2B27',
  muted: '#6B635B',
  line: '#ECE5DB', // linhas bem suaves
  hair: '#F1ECE4', // divisórias quase invisíveis
  sand: '#F4EEE5',
  faint: '#B3A99F', // ícones e setas discretos
  accent: '#5C7894',
  danger: '#A2656A',
  ok: '#66855F',
  glass: 'rgba(255,255,255,0.7)', // cartão translúcido sobre cor
  field: '#FAF6F0', // fundo de campo de texto grande
  placeholder: '#B8AEA4',
};

const ESCURO: typeof CLARO = {
  bg: '#1B1917',
  surface: '#262320',
  ink: '#EEE7DE',
  muted: '#AFA59A',
  line: '#3A3531',
  hair: '#2F2B28',
  sand: '#2C2825',
  faint: '#6F675F',
  accent: '#93AECA',
  danger: '#D29399',
  ok: '#97B98F',
  glass: 'rgba(255,255,255,0.07)',
  field: '#2B2724',
  placeholder: '#7C746B',
};

export const C = DARK ? ESCURO : CLARO;

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const hex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

/** Cor clarinha de fundo (mês, categoria). No escuro vira um tom escuro da mesma cor. */
export const soft = (c: string) => (DARK && hex(c) ? mix(c, '#1B1917', 0.8) : c);
/** Cor forte (texto, botões). No escuro clareia um pouco para dar leitura. */
export const strongC = (c: string) => (DARK && hex(c) ? mix(c, '#FFFFFF', 0.22) : c);

/** Troca o modo e recarrega o app para aplicar. */
export function setTema(t: Tema) {
  try { (globalThis as any).localStorage?.setItem(KEY, t); } catch {}
  if (Platform.OS === 'web') setTimeout(() => window.location.reload(), 150);
}

export const F = {
  title: 'EBGaramond_500Medium',
  titleItalic: 'EBGaramond_400Regular_Italic',
  body: 'IBMPlexSans_400Regular',
  bodyMed: 'IBMPlexSans_500Medium',
  bodySemi: 'IBMPlexSans_600SemiBold',
};

export const R = { sm: 10, md: 14, lg: 22 };
