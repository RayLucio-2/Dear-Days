import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { DIAS, fromKey, key, mkey, today } from '@/lib/dates';
import { MOODC, MOODN, MOODT } from '@/lib/planner';
import { useWide } from '@/lib/layout';
import { Card, Row, Screen, T } from '@/components/ui';
import { MonthNav } from '@/components/MonthNav';
import { Flower } from '@/components/charts';
import { Face } from '@/components/art';
import { C, F, R } from '@/lib/theme';

/** Balanço emocional do mês: calendário colorido pela emoção do dia e a flor do sentir. */
export default function Emocoes() {
  const cur = useStore((s) => s.cur);
  const docs = useStore((s) => s.docs);
  const setCur = useStore((s) => s.setCur);
  const wide = useWide();
  const d = fromKey(cur);
  const y = d.getFullYear(), m = d.getMonth(), n = new Date(y, m + 1, 0).getDate(), first = new Date(y, m, 1).getDay();
  const tk = key(today());
  const counts = MOODN.map(() => 0);
  let marked = 0;
  const cells: ({ k: string; day: number; mo: number } | null)[] = [...Array(first).fill(null)];
  for (let i = 1; i <= n; i++) {
    const k = `${mkey(d)}-${String(i).padStart(2, '0')}`, mo = Number(docs['d-' + k]?.mood || 0);
    if (mo) { counts[mo - 1]++; marked++; }
    cells.push({ k, day: i, mo });
  }
  while (cells.length % 7) cells.push(null);
  let top = -1;
  counts.forEach((c, i) => { if (c && (top < 0 || c > counts[top])) top = i; });
  const others = counts.filter(Boolean).length > 1;

  return (
    <Screen>
      <MonthNav eyebrow="Balanço emocional" />
      <T muted small style={{ marginTop: -8, marginBottom: 12 }}>Toque em um dia para abrir a página dele e marcar a emoção.</T>
      <View style={wide ? { flexDirection: 'row', gap: 12 } : null}>
        <Card title="Calendário das emoções" style={wide ? { flex: 1 } : undefined}>
          <View style={st.grid}>
            {DIAS.map((x) => <Text key={x} style={st.h}>{x}</Text>)}
            {cells.map((c, i) => c ? (
              <Pressable key={c.k} onPress={() => { setCur(c.k); router.navigate('/dia'); }} accessibilityLabel={`${c.day}: ${c.mo ? MOODN[c.mo - 1] : 'sem emoção marcada'}`} style={st.cell}>
                <View style={[st.ball, c.mo ? { backgroundColor: MOODC[c.mo - 1] } : null, c.k === tk && { borderColor: C.ink, borderWidth: 1.5 }]}>
                  <Text style={[st.n, c.mo ? { color: MOODT[c.mo - 1] } : null]}>{c.day}</Text>
                </View>
              </Pressable>
            ) : <View key={'o' + i} style={st.cell} />)}
          </View>
          <View style={[st.sum, { backgroundColor: top < 0 ? C.sand : MOODC[top] + '44' }]}>
            {top < 0 ? <T>Marque como você se sentiu na página de cada dia. O balanço aparece aqui.</T> : (
              <>
                <Face i={top} size={40} />
                <Text style={[st.sumT, { flex: 1 }]}>
                  <Text style={{ fontFamily: F.bodySemi }}>{MOODN[top][0].toUpperCase() + MOODN[top].slice(1)} ({Math.round((counts[top] / marked) * 100)}%)</Text> foi o estado mais recorrente{others ? ', acompanhado de outras emoções no mês' : ' no mês'}.
                </Text>
              </>
            )}
          </View>
        </Card>
        <Card title="Sua flor do sentir" style={wide ? { flex: 1 } : undefined}>
          <Flower counts={counts} size={wide ? 340 : 280} />
          <Row style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {MOODN.map((nm, i) => (
              <View key={nm} style={st.chip}><View style={[st.dot, { backgroundColor: MOODC[i] }]} /><Text style={st.chipT}>{nm} <Text style={{ fontFamily: F.bodySemi }}>{counts[i]}</Text></Text></View>
            ))}
          </Row>
        </Card>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  h: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: F.bodyMed, fontSize: 11, color: C.muted, textTransform: 'uppercase', paddingVertical: 6 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  ball: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.sand },
  n: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink },
  sum: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: R.md, padding: 12, marginTop: 12 },
  sumT: { fontFamily: F.body, fontSize: 14, color: C.ink, lineHeight: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.sand, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  chipT: { fontFamily: F.body, fontSize: 13, color: C.ink },
});
