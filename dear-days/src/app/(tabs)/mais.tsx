import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { today } from '@/lib/dates';
import { monthColor } from '@/lib/planner';
import { TOOLS } from '@/lib/tools';
import { useWide } from '@/lib/layout';
import { DEF_TABS, listOf, MOBILE_TABS, TAB_VIEWS } from '@/lib/prefs';

import { H1, Screen, Section } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

const PAGE_ICON: Record<string, string> = {
  dia: 'sunny-outline', semana: 'albums-outline', mes: 'calendar-outline', habitos: 'leaf-outline', financas: 'wallet-outline',
  emocoes: 'flower-outline', graficos: 'bar-chart-outline', ano: 'calendar-number-outline', rotina: 'repeat-outline',
};

type Item = { n: string; icon: string; go: () => void; badge?: number };

/** Tudo o que não cabe nas abas: no celular, Semana, Emoções e Gráficos ficam aqui também. */
export default function Mais() {
  const wide = useWide();
  const inbox = useStore((s) => (Array.isArray(s.docs['t-inbox']?.l) ? s.docs['t-inbox'].l.length : 0));
  const [soft, strong] = monthColor(today());
  const nav = (p: any) => () => router.navigate(p);

  const cfg = useStore((s) => s.docs['t-cfg']);
  const valid = TAB_VIEWS.map(([v]) => v);
  const chosen = listOf(cfg, 'tabs', DEF_TABS).filter((v) => valid.includes(v));
  const shown = wide ? chosen : chosen.slice(0, MOBILE_TABS);
  // As páginas que não estão nas abas aparecem aqui
  const pages: Item[] = [
    ...TAB_VIEWS.filter(([v]) => !shown.includes(v)).map(([v, n]) => ({ n, icon: PAGE_ICON[v] || 'document-outline', go: nav('/' + v) })),
    { n: 'Caixa de entrada', icon: 'file-tray-outline', go: () => router.push('/caixa'), badge: inbox },
    { n: 'Revisão da semana', icon: 'refresh-outline', go: () => router.push('/revisao') },
    { n: 'Personalizar', icon: 'color-palette-outline', go: nav('/personalizar') },
    { n: 'Conta, avisos e cópia', icon: 'person-circle-outline', go: () => router.push('/conta') },
  ];
  const tools: Item[] = TOOLS.map((t) => ({ n: t.n, icon: t.icon, go: () => router.navigate({ pathname: '/ferramenta', params: { k: t.k } }) }));

  return (
    <Screen>
      <H1 sub="Dear Days" color={strong}>Mais páginas e ferramentas</H1>
      <Section title="Páginas" color={strong} />
      <Grid items={pages} soft={soft} strong={strong} wide={wide} />
      <Section title="Ferramentas" color={strong} />
      <Grid items={tools} soft={soft} strong={strong} wide={wide} />
    </Screen>
  );
}

function Grid({ items, soft, strong, wide }: { items: Item[]; soft: string; strong: string; wide: boolean }) {
  return (
    <View style={st.grid}>
      {items.map((x) => (
        <Pressable key={x.n} onPress={x.go} accessibilityRole="button" style={({ pressed }) => [st.tile, { flexBasis: wide ? '31%' : '47%', flexGrow: 1, maxWidth: wide ? '33%' : '50%' }, pressed && { opacity: 0.7 }]}>
          <View style={[st.ic, { backgroundColor: soft }]}><Ionicons name={x.icon as any} size={20} color={strong} /></View>
          <Text style={st.t} numberOfLines={2}>{x.n}</Text>
          {x.badge ? <View style={[st.badge, { backgroundColor: strong }]}><Text style={st.badgeT}>{x.badge}</Text></View> : null}
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 12, marginBottom: 8 },
  tile: { backgroundColor: C.surface, borderRadius: R.lg, padding: 16, gap: 12, minHeight: 100 },
  ic: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  t: { fontFamily: F.bodyMed, fontSize: 14, color: C.ink },
  badge: { position: 'absolute', top: 12, right: 12, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeT: { fontFamily: F.bodySemi, fontSize: 12, color: '#fff' },
});
