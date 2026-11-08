import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { addDays, DIAS, fromKey, holiday, key, pad, sunday, today } from '@/lib/dates';
import { dayInfo, MOODC, monthColor } from '@/lib/planner';
import { useWide } from '@/lib/layout';
import { Btn, Card, DocCheck, Field, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { Face } from '@/components/art';
import { C, F, R } from '@/lib/theme';

/** Semana (igual ao planner web): compromissos de cada dia, prioridades e a fazer em w-<domingo>. */
export default function Semana() {
  const cur = useStore((s) => s.cur);
  const setCur = useStore((s) => s.setCur);
  const docs = useStore((s) => s.docs);
  const wide = useWide();
  const d = fromKey(cur);
  const s0 = sunday(d), e = addDays(s0, 6);
  const id = 'w-' + key(s0);
  const tk = key(today());
  const [soft, strong] = monthColor(d);
  const thisWeek = key(sunday(today())) === key(s0);

  return (
    <Screen>
      <View style={st.head}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.eyebrow, { color: strong }]}>Semana</Text>
          <Text style={ui.h1}>{pad(s0.getDate())}/{pad(s0.getMonth() + 1)} a {pad(e.getDate())}/{pad(e.getMonth() + 1)}</Text>
        </View>
        <IconBtn icon="chevron-back" label="Semana anterior" onPress={() => setCur(key(addDays(d, -7)))} />
        {!thisWeek ? <Btn kind="soft" title="Hoje" onPress={() => setCur(tk)} style={{ minHeight: 34, paddingHorizontal: 12 }} /> : null}
        <IconBtn icon="chevron-forward" label="Próxima semana" onPress={() => setCur(key(addDays(d, 7)))} />
      </View>
      <T muted small style={{ marginBottom: 12 }}>Toque no nome do dia para abrir a página dele.</T>

      <View style={st.days}>
        {Array.from({ length: 7 }, (_, i) => {
          const x = addDays(s0, i), k = key(x), inf = dayInfo(docs, x), fer = holiday(x);
          return (
            <View key={k} style={[st.day, { width: wide ? '32%' : '100%' }, k === tk && { borderColor: strong, borderWidth: 1.5 }]}>
              <Pressable onPress={() => { setCur(k); router.navigate('/dia'); }} accessibilityRole="button" style={[st.dayHead, { backgroundColor: k === tk ? soft : C.sand }]}>
                <Text style={st.dayN}>{DIAS[i]} <Text style={{ fontFamily: F.title, fontSize: 18 }}>{pad(x.getDate())}/{pad(x.getMonth() + 1)}</Text></Text>
                <Row style={{ gap: 6 }}>
                  {fer ? <T small style={{ color: C.danger }}>{fer}</T> : null}
                  {inf.total ? <T small muted>{inf.done}/{inf.total}</T> : null}
                  {inf.mood ? <View style={[st.dot, { backgroundColor: MOODC[inf.mood - 1] }]} /> : null}
                </Row>
              </Pressable>
              <Field doc={id} path={`days.${i}`} multiline placeholder="Compromissos e lembretes" style={st.area} />
            </View>
          );
        })}
      </View>

      <View style={wide ? st.cols : null}>
        <Card title="Prioridades da semana" style={wide ? { flex: 1 } : undefined}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Row key={i}><Text style={[st.n, { color: strong }]}>{i + 1}</Text><Field doc={id} path={`prios.${i}`} placeholder={i === 0 ? 'O que precisa acontecer' : ''} /></Row>
          ))}
        </Card>
        <Card title="A fazer" style={wide ? { flex: 1 } : undefined}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Row key={i}>
              <DocCheck doc={id} path={`todo.${i}.ok`} color={strong} label="Feito" />
              <Field doc={id} path={`todo.${i}.t`} placeholder={i === 0 ? 'Tarefas da semana' : ''} style={docs[id]?.todo?.[i]?.ok ? { textDecorationLine: 'line-through', color: C.muted } : undefined} />
            </Row>
          ))}
        </Card>
      </View>

      <Card title="Humor da semana">
        <Row style={{ justifyContent: 'space-between' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const inf = dayInfo(docs, addDays(s0, i));
            return (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <T muted small>{DIAS[i]}</T>
                {inf.mood ? <Face i={inf.mood - 1} size={32} /> : <View style={st.empty} />}
              </View>
            );
          })}
        </Row>
        <T muted small style={{ marginTop: 8 }}>Marque o humor na página de cada dia.</T>
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 4 },
  days: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 12 },
  day: { backgroundColor: C.surface, borderRadius: R.lg, overflow: 'hidden' },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  dayN: { fontFamily: F.bodySemi, fontSize: 12, color: C.ink, textTransform: 'uppercase', letterSpacing: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  area: { borderWidth: 0, borderRadius: 0, minHeight: 70, margin: 0, backgroundColor: C.surface },
  cols: { flexDirection: 'row', gap: 12 },
  n: { fontFamily: F.title, fontSize: 20, width: 16 },
  empty: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.sand },
});
