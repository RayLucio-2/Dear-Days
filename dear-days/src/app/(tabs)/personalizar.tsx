import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { today } from '@/lib/dates';
import { COR, monthColor } from '@/lib/planner';
import { useWide } from '@/lib/layout';
import {
  CUSTOM_SWATCHES, DEF_FAV, DEF_HOME, DEF_TABS, FAV_VIEWS, HOME_BLOCKS, isHex, listOf, MAX_FAV, MOBILE_TABS, START_OPTS, TAB_VIEWS, THEMES,
} from '@/lib/prefs';
import { Btn, Card, H1, IconBtn, Row, Screen, T } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/** Personalizar: cor, abas, tela de Início, atalhos e a tela que abre primeiro. Fica em t-cfg (vale no site e no app). */
export default function Personalizar() {
  const cfg = useStore((s) => s.docs['t-cfg']) || {};
  const set = useStore((s) => s.set);
  const wide = useWide();
  const [, strong] = monthColor(today());
  const th = cfg.theme || 'mes';
  const [hex, setHex] = useState(isHex(cfg.custom) ? cfg.custom : '#8A6579');
  const [msg, setMsg] = useState('');
  const half = { width: wide ? ('49%' as const) : ('100%' as const) };

  function custom(h: string) {
    setHex(h);
    if (isHex(h)) { set('t-cfg', 'custom', h); set('t-cfg', 'theme', 'custom'); }
  }
  function reset() {
    ['theme', 'custom', 'tabs', 'home', 'fav'].forEach((k) => set('t-cfg', k, undefined));
    set('t-cfg', 'app.start', undefined);
    setMsg('Tudo voltou ao padrão.');
  }

  return (
    <Screen>
      <H1 sub="Dear Days" color={strong}>Personalizar</H1>
      <T muted style={{ marginTop: -6, marginBottom: 14 }}>Suas escolhas ficam salvas na sua conta e valem no site e no celular.</T>

      <View style={st.cols}>
        <Card title="Cor do planner" style={half}>
          <View style={st.sws}>
            {THEMES.map(([k, n, c]) => {
              const on = th === k;
              return (
                <Pressable key={k} onPress={() => set('t-cfg', 'theme', k)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[st.sw, on && { borderColor: C.ink }]}>
                  {c ? <View style={[st.dot, { backgroundColor: c[1] }]} /> : (
                    <View style={st.multi}>{[0, 3, 6, 9].map((m) => <View key={m} style={{ flex: 1, backgroundColor: COR[m][1] }} />)}</View>
                  )}
                  <Text style={st.swT}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={st.label}>Ou uma cor sua</Text>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {CUSTOM_SWATCHES.map((h) => (
              <Pressable key={h} onPress={() => custom(h)} accessibilityLabel={`Cor ${h}`} style={[st.big, { backgroundColor: h }, th === 'custom' && cfg.custom === h && { borderColor: C.ink }]} />
            ))}
            <Row style={[st.hexBox, th === 'custom' && { borderColor: C.ink }]}>
              <View style={[st.dot, { backgroundColor: isHex(hex) ? hex : C.line }]} />
              <TextInput value={hex} onChangeText={(v) => custom(v.startsWith('#') ? v : '#' + v)} maxLength={7} autoCapitalize="none" style={st.hexIn} accessibilityLabel="Código da cor, como #8A6579" />
            </Row>
          </Row>
          <T muted small style={{ marginTop: 10 }}>&quot;Cor de cada mês&quot; troca a cor sozinha a cada mês. As outras deixam o planner sempre na mesma cor.</T>
        </Card>

        <Card title="Abrir o app em" style={half}>
          <T muted small style={{ marginBottom: 10 }}>A tela que aparece primeiro quando você abre o planner.</T>
          <View style={{ gap: 8 }}>
            {START_OPTS.map(([k, n]) => {
              const on = (cfg.app?.start || 'inicio') === k;
              return (
                <Pressable key={k} onPress={() => set('t-cfg', 'app.start', k === 'inicio' ? undefined : k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={[st.opt, on && { borderColor: strong, backgroundColor: C.sand }]}>
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? strong : C.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.optT}>{n}</Text>
                    <T muted small>{k === 'inicio' ? 'Resumo do dia, atalhos e saldo' : k === 'dia' ? 'A página do dia com tudo' : 'Uma tarefa por vez, sem distração'}</T>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card title="Abas" style={half}>
          <T muted small style={{ marginBottom: 10 }}>
            Início e Mais sempre aparecem. No celular, só as {MOBILE_TABS} primeiras viram aba; as outras ficam em Mais. No computador, todas aparecem no menu.
          </T>
          <OrderList k="tabs" def={DEF_TABS} options={TAB_VIEWS} color={strong} mark={MOBILE_TABS} />
        </Card>

        <Card title="Tela de Início" style={half}>
          <T muted small style={{ marginBottom: 10 }}>O que aparece no Início, na ordem que você quiser.</T>
          <OrderList k="home" def={DEF_HOME} options={HOME_BLOCKS} color={strong} />
        </Card>

        <Card title="Atalhos do Início" style={half}>
          <T muted small style={{ marginBottom: 10 }}>Os cartões grandes do Início (aparecem se o bloco Atalhos estiver ligado). Até {MAX_FAV}.</T>
          <OrderList k="fav" def={DEF_FAV} options={FAV_VIEWS.map(([v, n]) => [v, n])} color={strong} max={MAX_FAV} />
        </Card>
      </View>

      <Row style={{ marginTop: 4 }}>
        <Btn kind="soft" title="Voltar ao padrão" icon="refresh-outline" onPress={reset} color={C.ink} />
        {msg ? <T muted small>{msg}</T> : null}
      </Row>
    </Screen>
  );
}

/** Lista para ligar, desligar e mudar a ordem (setas). Ligados ficam em cima. */
function OrderList({ k, def, options, color, max, mark }: { k: 'tabs' | 'home' | 'fav'; def: string[]; options: [string, string][]; color: string; max?: number; mark?: number }) {
  const cfg = useStore((s) => s.docs['t-cfg']);
  const set = useStore((s) => s.set);
  const valid = options.map(([v]) => v);
  const on = listOf(cfg, k, def).filter((v) => valid.includes(v));
  const off = valid.filter((v) => !on.includes(v));
  const name = (v: string) => options.find((o) => o[0] === v)?.[1] || v;
  const save = (l: string[]) => set('t-cfg', k, l);
  const move = (i: number, d: number) => { const l = on.slice(); const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; save(l); };
  const full = max != null && on.length >= max;

  return (
    <View>
      {on.map((v, i) => (
        <View key={v}>
          {mark != null && i === mark ? <Text style={st.mark}>No celular, estas ficam em Mais</Text> : null}
          <Row style={st.row}>
            <Pressable onPress={() => save(on.filter((x) => x !== v))} accessibilityRole="checkbox" accessibilityState={{ checked: true }} accessibilityLabel={`Tirar ${name(v)}`} hitSlop={6}>
              <Ionicons name="checkbox" size={22} color={color} />
            </Pressable>
            <Text style={st.rowT}>{name(v)}</Text>
            <IconBtn icon="arrow-up" label={`Subir ${name(v)}`} onPress={() => move(i, -1)} size={18} color={i === 0 ? C.line : C.muted} />
            <IconBtn icon="arrow-down" label={`Descer ${name(v)}`} onPress={() => move(i, 1)} size={18} color={i === on.length - 1 ? C.line : C.muted} />
          </Row>
        </View>
      ))}
      {off.map((v) => (
        <Row key={v} style={[st.row, { opacity: full ? 0.4 : 1 }]}>
          <Pressable onPress={() => { if (!full) save([...on, v]); }} disabled={full} accessibilityRole="checkbox" accessibilityState={{ checked: false }} accessibilityLabel={`Colocar ${name(v)}`} hitSlop={6}>
            <Ionicons name="square-outline" size={22} color={C.muted} />
          </Pressable>
          <Text style={[st.rowT, { color: C.muted }]}>{name(v)}</Text>
        </Row>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  cols: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sws: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sw: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, minHeight: 40, backgroundColor: C.surface },
  swT: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink },
  dot: { width: 18, height: 18, borderRadius: 9 },
  multi: { width: 18, height: 18, borderRadius: 9, overflow: 'hidden', flexDirection: 'row' },
  label: { fontFamily: F.bodySemi, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 14, marginBottom: 8 },
  big: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  hexBox: { borderWidth: 1.5, borderColor: C.line, borderRadius: 999, paddingHorizontal: 10, minHeight: 38, gap: 6 },
  hexIn: { fontFamily: F.bodyMed, fontSize: 14, color: C.ink, width: 80, minHeight: 34 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 12 },
  optT: { fontFamily: F.bodyMed, fontSize: 15, color: C.ink },
  row: { borderBottomWidth: 1, borderBottomColor: C.hair, minHeight: 46 },
  rowT: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
  mark: { fontFamily: F.bodySemi, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 2 },
});
