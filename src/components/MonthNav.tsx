import { Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { addMonths, fromKey, key, MESES, today } from '@/lib/dates';
import { monthColor } from '@/lib/planner';
import { Btn, IconBtn, s as ui } from './ui';

/** Título do mês com setas. Mudar o mês leva a data selecionada para o dia 1. */
export function MonthNav({ eyebrow }: { eyebrow: string }) {
  const cur = useStore((s) => s.cur);
  const setCur = useStore((s) => s.setCur);
  const d = fromKey(cur);
  const [, strong] = monthColor(d);
  const t = today();
  const same = d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 14 }}>
      <View style={{ flex: 1 }}>
        <Text style={[ui.eyebrow, { color: strong }]}>{eyebrow} · {d.getFullYear()}</Text>
        <Text style={ui.h1}>{MESES[d.getMonth()]}</Text>
      </View>
      <IconBtn icon="chevron-back" label="Mês anterior" onPress={() => setCur(key(addMonths(d, -1)))} />
      {!same ? <Btn kind="soft" title="Hoje" onPress={() => setCur(key(t))} style={{ minHeight: 34, paddingHorizontal: 12 }} /> : null}
      <IconBtn icon="chevron-forward" label="Próximo mês" onPress={() => setCur(key(addMonths(d, 1)))} />
    </View>
  );
}
