import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { MESES, today } from '@/lib/dates';
import { bolinhasDoMes, frasePote } from '@/lib/potinho';
import { C, DARK, F, R } from '@/lib/theme';

const CAP = 84; // bolinhas que enchem o pote
const W = 120, H = 150;
const POTE = 'M30 22 h60 v10 q14 6 14 24 v66 q0 18 -18 18 h-52 q-18 0 -18 -18 v-66 q0 -18 14 -24 z';

/** Bolinhas arrumadas de baixo para cima, com um leve desalinho para parecer de verdade. */
function posicoes(n: number) {
  const r = 5.2, gap = 11, cols = 8, x0 = 21, y0 = 132;
  return Array.from({ length: Math.min(n, CAP) }, (_, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const jx = ((i * 37) % 7) - 3, jy = ((i * 53) % 5) - 2;
    return { x: x0 + col * gap + (row % 2 ? 5 : 0) + jx * 0.4, y: y0 - row * (gap - 1) + jy * 0.4, r };
  });
}

export function Potinho({ strong }: { strong: string }) {
  const docs = useStore((s) => s.docs);
  const hoje = today();
  const bol = bolinhasDoMes(docs, hoje);
  const pos = posicoes(bol.length);
  const vidro = DARK ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)';
  const contorno = DARK ? 'rgba(255,255,255,0.25)' : '#E3D9CC';
  const t = bol.filter((b) => b.tipo !== 'habito').length, h = bol.length - t;

  return (
    <Pressable onPress={() => router.navigate('/habitos')} accessibilityRole="button"
      accessibilityLabel={`Potinho de ${MESES[hoje.getMonth()]}: ${bol.length} bolinhas`} style={st.card}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="pote"><Path d={POTE} /></ClipPath>
        </Defs>
        <Path d={POTE} fill={vidro} stroke={contorno} strokeWidth={2} />
        <G clipPath="url(#pote)">
          {pos.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={p.r} fill={bol[i].cor} />)}
        </G>
        <Rect x={26} y={12} width={68} height={12} rx={5} fill={strong} />
        <Path d="M38 42 q-6 30 0 70" stroke="#FFFFFF" strokeOpacity={DARK ? 0.15 : 0.7} strokeWidth={4} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={st.eyebrow}>Potinho de {MESES[hoje.getMonth()].toLowerCase()}</Text>
        <Text style={st.n}>{bol.length} <Text style={st.nL}>bolinha{bol.length === 1 ? '' : 's'}</Text></Text>
        <Text style={st.frase}>{frasePote(bol.length)}</Text>
        {bol.length ? <Text style={st.sub}>{t} tarefa{t === 1 ? '' : 's'} · {h} hábito{h === 1 ? '' : 's'}{bol.length > CAP ? ` · transbordou ${bol.length - CAP}!` : ''}</Text> : null}
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.surface, borderRadius: R.lg, padding: 16, marginBottom: 14 },
  eyebrow: { fontFamily: F.bodySemi, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.3 },
  n: { fontFamily: F.title, fontSize: 34, color: C.ink },
  nL: { fontFamily: F.body, fontSize: 15, color: C.muted },
  frase: { fontFamily: F.body, fontSize: 14, color: C.ink, lineHeight: 20 },
  sub: { fontFamily: F.body, fontSize: 12, color: C.muted },
});
