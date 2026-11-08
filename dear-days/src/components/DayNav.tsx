import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { addDays, DIAS, fromKey, holiday, key, sunday, today } from '@/lib/dates';
import { dayInfo, monthColor } from '@/lib/planner';
import { C, F } from '@/lib/theme';
import { IconBtn } from './ui';

/** Faixa da semana com setas, igual ao planner web. */
export function DayNav() {
  const cur = useStore((s) => s.cur);
  const setCur = useStore((s) => s.setCur);
  const docs = useStore((s) => s.docs);
  const d = fromKey(cur);
  const start = sunday(d);
  const [soft, strong] = monthColor(d);
  const tk = key(today());
  return (
    <View style={st.wrap}>
      <IconBtn icon="chevron-back" label="Semana anterior" onPress={() => setCur(key(addDays(d, -7)))} />
      <View style={st.days}>
        {Array.from({ length: 7 }, (_, i) => {
          const x = addDays(start, i);
          const k = key(x);
          const sel = k === cur;
          const info = dayInfo(docs, x);
          const fer = holiday(x);
          return (
            <Pressable key={k} onPress={() => setCur(k)} accessibilityRole="button" accessibilityLabel={`${DIAS[i]} ${x.getDate()}${fer ? ', ' + fer : ''}`}
              style={[st.day, sel && { backgroundColor: strong }, !sel && k === tk && { borderColor: strong, borderWidth: 1.5 }]}>
              <Text style={[st.dn, sel && { color: '#fff' }, fer && !sel ? { color: C.danger } : null]}>{DIAS[i]}</Text>
              <Text style={[st.dd, sel && { color: '#fff' }]}>{x.getDate()}</Text>
              <View style={[st.dot, { backgroundColor: info.total ? (info.done === info.total ? (sel ? '#fff' : strong) : soft) : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>
      <IconBtn icon="chevron-forward" label="Próxima semana" onPress={() => setCur(key(addDays(d, 7)))} />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  days: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent' },
  dn: { fontFamily: F.bodyMed, fontSize: 11, color: C.muted, textTransform: 'uppercase' },
  dd: { fontFamily: F.title, fontSize: 20, color: C.ink },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});
