import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { DIAS, fromKey, holiday, key, mkey, today } from '@/lib/dates';
import { dayInfo, MOODC, monthColor } from '@/lib/planner';
import { Card, DocCheck, Field, Fold, Row, Screen, T } from '@/components/ui';
import { MonthNav } from '@/components/MonthNav';
import { C, F } from '@/lib/theme';

export default function Mes() {
  const cur = useStore((s) => s.cur);
  const docs = useStore((s) => s.docs);
  const setCur = useStore((s) => s.setCur);
  const d = fromKey(cur);
  const y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1).getDay();
  const n = new Date(y, m + 1, 0).getDate();
  const tk = key(today());
  const id = 'm-' + mkey(d);
  const [soft, strong] = monthColor(d);

  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(y, m, i + 1))];
  while (cells.length % 7) cells.push(null);

  return (
    <Screen>
      <MonthNav eyebrow="Mês" />
      <Card style={{ padding: 10 }} tint={strong}>
        <View style={st.grid}>
          {DIAS.map((x) => <Text key={x} style={st.h}>{x}</Text>)}
          {cells.map((c, i) => {
            if (!c) return <View key={'o' + i} style={st.cell} />;
            const k = key(c);
            const info = dayInfo(docs, c);
            const fer = holiday(c);
            const past = k < tk;
            return (
              <Pressable key={k} onPress={() => { setCur(k); router.navigate('/dia'); }} accessibilityRole="button" accessibilityLabel={`${c.getDate()}${fer ? ', ' + fer : ''}${past ? ', já passou' : ''}`}
                style={({ pressed }) => [st.cell, st.day, k === tk && { backgroundColor: soft, borderColor: strong }, pressed && { opacity: 0.6 }]}>
                <Text style={[st.dn, fer ? { color: C.danger } : null, past && st.past]}>{c.getDate()}</Text>
                <View style={st.ind}>
                  {info.mood ? <View style={[st.dot, { backgroundColor: MOODC[info.mood - 1] }]} /> : null}
                  {info.total ? <Text style={[st.cnt, info.done === info.total && { color: strong }]}>{info.done}/{info.total}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <T muted small style={{ marginTop: 8, paddingHorizontal: 4 }}>Toque em um dia para abrir a página dele.</T>
      </Card>

      <Card title="3 metas do mês">
        {[0, 1, 2].map((i) => (
          <Row key={i} style={st.line}>
            <DocCheck doc={id} path={`metas.${i}.ok`} color={strong} label="Meta concluída" />
            <Field doc={id} path={`metas.${i}.t`} placeholder={i === 0 ? 'O que quero conquistar este mês' : ''} style={{ borderBottomWidth: 0 }} />
          </Row>
        ))}
      </Card>

      <Card title="Prioridades">
        {[0, 1, 2, 3].map((i) => (
          <Row key={i}>
            <Text style={[st.n, { color: strong }]}>{i + 1}</Text>
            <Field doc={id} path={`prios.${i}`} placeholder={i === 0 ? 'O que vem primeiro' : ''} />
          </Row>
        ))}
      </Card>

      <Fold id="mes-notas" title="Notas do mês" icon="document-text-outline" color={strong} summary={docs[id]?.notes ? String(docs[id].notes) : "ideias, lembretes, datas"}>
        <Field doc={id} path="notes" multiline placeholder="Ideias, lembretes, datas" style={{ minHeight: 160 }} />
      </Fold>
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  h: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: F.bodyMed, fontSize: 11, color: C.muted, textTransform: 'uppercase', paddingVertical: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.9, padding: 2 },
  day: { borderRadius: 10, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', paddingTop: 6 },
  dn: { fontFamily: F.title, fontSize: 18, color: C.ink },
  past: { color: C.faint, textDecorationLine: 'line-through' },
  ind: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  cnt: { fontFamily: F.body, fontSize: 10, color: C.muted },
  line: { borderBottomWidth: 1, borderBottomColor: C.hair },
  n: { fontFamily: F.title, fontSize: 20, width: 18 },
});
