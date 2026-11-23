import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { addDays, DIAS, key, today } from '@/lib/dates';
import { HAB_CORES, monthColor } from '@/lib/planner';
import { Card, Field, H1, Row, Screen, T } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/** "23:30" -> minutos */
const min = (s: unknown) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const hm = (m: number) => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
const QUAL = [['Pouco descanso', 'cloudy-outline'], ['Mais ou menos', 'partly-sunny-outline'], ['Descansei bem', 'sunny-outline']] as const;

/**
 * Noite que termina no dia D: "dormi" do dia anterior (ou do próprio dia, se for de madrugada) até "acordei" do dia D.
 * Usa os campos que já existem no Dia: sleep (hora que dormiu) e wake (hora que acordou).
 */
function noite(docs: any, d: Date): number | null {
  const w = min(docs['d-' + key(d)]?.wake);
  if (w == null) return null;
  const antes = min(docs['d-' + key(addDays(d, -1))]?.sleep);
  if (antes == null) return null;
  const dur = antes >= 12 * 60 ? 24 * 60 - antes + w : w - antes;
  return dur > 0 && dur < 16 * 60 ? dur : null;
}

export default function Sono() {
  const docs = useStore((s) => s.docs);
  const meta = Number(useStore((s) => s.docs['t-cfg']?.app?.sonoMeta)) || 8;
  const { set } = useStore.getState();
  const [, strong] = monthColor(today());
  const roxo = HAB_CORES[3].c;
  const hoje = today();
  const ontem = addDays(hoje, -1);
  const noites = Array.from({ length: 14 }, (_, i) => { const d = addDays(hoje, -13 + i); return { d, m: noite(docs, d) }; });
  const ultima = noites[13].m ?? noites[12].m;
  const semana = noites.slice(7).map((x) => x.m).filter((x): x is number => x != null);
  const media = semana.length ? semana.reduce((a, b) => a + b, 0) / semana.length : null;
  const melhor = semana.length ? Math.max(...semana) : null;
  const pc = ultima ? Math.min(1, ultima / (meta * 60)) : 0;
  const q = docs['d-' + key(hoje)]?.sonoq;
  const maxBar = Math.max(meta * 60, ...noites.map((x) => x.m ?? 0));
  const R0 = 42, CIRC = 2 * Math.PI * R0;

  const frase = !ultima ? 'Anote que horas dormiu ontem e que horas acordou hoje.'
    : ultima >= meta * 60 ? 'Você bateu sua meta de sono. Seu corpo agradece.'
    : ultima >= meta * 60 - 60 ? 'Quase lá: faltou pouquinho para a sua meta.'
    : 'Noite curta. Hoje vale ir com calma e escolher tarefas mais leves.';

  return (
    <Screen>
      <H1 sub="Descanso" color={strong}>Sono</H1>

      <View style={[st.hero, { backgroundColor: roxo[0] }]}>
        <Row style={{ gap: 18 }}>
          <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={100} height={100} style={{ position: 'absolute' }}>
              <Circle cx={50} cy={50} r={R0} stroke={roxo[1]} strokeWidth={9} fill="none" />
              <Circle cx={50} cy={50} r={R0} stroke={roxo[2]} strokeWidth={9} fill="none" strokeLinecap="round"
                strokeDasharray={`${CIRC * pc} ${CIRC}`} transform="rotate(-90 50 50)" />
            </Svg>
            <Text style={st.ringV}>{ultima ? hm(ultima) : '--'}</Text>
            <Text style={st.ringL}>{ultima ? `${Math.round(pc * 100)}% da meta` : 'sem registro'}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.heroH}>Última noite</Text>
            <T style={{ lineHeight: 21 }}>{frase}</T>
          </View>
        </Row>
      </View>

      <Card title="Registrar a noite">
        <Row style={{ gap: 12 }}>
          <View style={{ flex: 1 }}><T muted small>dormi ontem às</T><Field doc={'d-' + key(ontem)} path="sleep" time /></View>
          <View style={{ flex: 1 }}><T muted small>acordei hoje às</T><Field doc={'d-' + key(hoje)} path="wake" time /></View>
        </Row>
        <T muted small style={{ marginTop: 14, marginBottom: 8 }}>Como acordou?</T>
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          {QUAL.map(([n, ic], i) => {
            const on = q === i + 1;
            return (
              <Pressable key={n} onPress={() => set('d-' + key(hoje), 'sonoq', on ? 0 : i + 1)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                style={[st.chip, on && { backgroundColor: roxo[2], borderColor: roxo[2] }]}>
                <Ionicons name={ic} size={16} color={on ? '#fff' : C.muted} />
                <Text style={[st.chipT, on && { color: '#fff' }]}>{n}</Text>
              </Pressable>
            );
          })}
        </Row>
      </Card>

      <View style={st.tiles}>
        <View style={st.tile}><Text style={st.tileL}>Média da semana</Text><Text style={st.tileV}>{media ? hm(media) : '--'}</Text></View>
        <View style={st.tile}><Text style={st.tileL}>Melhor noite</Text><Text style={st.tileV}>{melhor ? hm(melhor) : '--'}</Text></View>
      </View>

      <Card title="Últimas 2 semanas">
        <View style={st.chart}>
          {noites.map(({ d, m }, i) => (
            <View key={i} style={st.col}>
              <View style={st.barBox}>
                <View style={[st.bar, { height: m ? `${(m / maxBar) * 100}%` : 3, backgroundColor: m ? (m >= meta * 60 ? roxo[2] : roxo[1]) : C.line }]} />
              </View>
              <Text style={st.wd}>{DIAS[d.getDay()][0].toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <T muted small style={{ marginTop: 8 }}>A cor forte mostra as noites em que bateu a meta.</T>
        <Row style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <T muted small>Minha meta:</T>
          {[7, 7.5, 8, 9].map((h) => (
            <Pressable key={h} onPress={() => set('t-cfg', 'app.sonoMeta', h)} accessibilityRole="radio" accessibilityState={{ selected: meta === h }}
              style={[st.chip, { minHeight: 34 }, meta === h && { backgroundColor: roxo[2], borderColor: roxo[2] }]}>
              <Text style={[st.chipT, meta === h && { color: '#fff' }]}>{hm(h * 60)}</Text>
            </Pressable>
          ))}
        </Row>
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  hero: { borderRadius: R.lg, padding: 20, marginBottom: 12 },
  heroH: { fontFamily: F.title, fontSize: 24, color: C.ink },
  ringV: { fontFamily: F.bodySemi, fontSize: 18, color: C.ink },
  ringL: { fontFamily: F.body, fontSize: 10, color: C.muted },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, minHeight: 40, backgroundColor: C.surface },
  chipT: { fontFamily: F.body, fontSize: 13, color: C.ink },
  tiles: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tile: { flex: 1, backgroundColor: C.surface, borderRadius: R.md, padding: 14, gap: 4 },
  tileL: { fontFamily: F.body, fontSize: 12, color: C.muted },
  tileV: { fontFamily: F.bodySemi, fontSize: 22, color: C.ink },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 130 },
  col: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barBox: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
  wd: { fontFamily: F.body, fontSize: 10, color: C.muted },
});
