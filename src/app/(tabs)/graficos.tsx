import { StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { addMonths, ABR, fromKey, key, mkey, today } from '@/lib/dates';
import { brl, num } from '@/lib/money';
import { CATSTRONG, dayInfo, Docs, finSums, habits, MOODC, MOODN, monthColor, oxList, parcTotal, VARIA } from '@/lib/planner';
import { useWide } from '@/lib/layout';
import { Card, Row, Screen, T } from '@/components/ui';
import { MonthNav } from '@/components/MonthNav';
import { HBars, VBars } from '@/components/charts';
import { C, F } from '@/lib/theme';

/** Para onde foi o dinheiro: variáveis por categoria + parcelas + outras despesas agrupadas. */
function catItems(docs: Docs, d: Date) {
  const f = docs['f-' + mkey(d)] || {};
  const it = VARIA.map((l, i) => ({ l, v: num(f.var?.[i]?.v) }));
  const pc = parcTotal(docs, d);
  if (pc) it.push({ l: 'Parcelas', v: pc });
  const g: Record<string, number> = {};
  oxList(docs, d).forEach((x) => { if (!x) return; const c = String(x.c || '').trim() || 'Outras despesas'; g[c] = (g[c] || 0) + num(x.v); });
  Object.entries(g).forEach(([l, v]) => { const e = it.find((z) => z.l.toLowerCase() === l.toLowerCase()); if (e) e.v += v; else it.push({ l, v }); });
  return it.filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
}

export default function Graficos() {
  const cur = useStore((s) => s.cur);
  const docs = useStore((s) => s.docs);
  const wide = useWide();
  const d = fromKey(cur);
  const y = d.getFullYear(), m = d.getMonth(), n = new Date(y, m + 1, 0).getDate(), t = today();
  const passed = y < t.getFullYear() || (y === t.getFullYear() && m < t.getMonth()) ? n : y === t.getFullYear() && m === t.getMonth() ? t.getDate() : 0;
  const [, strong] = monthColor(d);
  const S = finSums(docs, d);
  const days = Array.from({ length: n }, (_, i) => { const x = new Date(y, m, i + 1); const inf = dayInfo(docs, x); return { ...inf, k: key(x) }; });
  const counts = MOODN.map(() => 0);
  days.forEach((x) => { if (x.mood) counts[x.mood - 1]++; });
  const mid = 'm-' + mkey(d);
  const hs = habits(docs).map((h) => { let k = 0; for (let i = 1; i <= n; i++) if (docs[mid]?.hk?.[h.id]?.[i]) k++; return { l: h.n || 'Sem nome', v: Math.round((k / (passed || n)) * 100) }; });
  const months = Array.from({ length: 6 }, (_, i) => { const x = addMonths(d, i - 5); const s = finSums(docs, x); return { l: `${ABR[x.getMonth()]}/${String(x.getFullYear()).slice(2)}`, v: s.bal, any: s.inc || s.out }; });
  const maxT = Math.max(3, ...days.map((x) => x.total));
  const cats = catItems(docs, d);
  const half = wide ? { flex: 1 } : undefined;

  return (
    <Screen>
      <MonthNav eyebrow="Gráficos" />
      <T muted small style={{ marginTop: -8, marginBottom: 12 }}>Os gráficos mudam conforme você preenche as outras páginas.</T>

      <View style={wide ? st.cols : null}>
        <Card title="Dinheiro do mês" style={half}>
          {S.inc || S.out || S.days ? (
            <>
              <Text style={[st.big, S.bal < 0 && { color: C.danger }]}>{brl(S.bal)}</Text>
              <T muted small style={{ marginBottom: 12 }}>saldo do mês</T>
              <HBars fmt={brl} color={strong} items={[
                { l: 'Entradas', v: S.inc }, { l: 'Despesas fixas', v: S.fix }, { l: 'Despesas variáveis', v: S.va },
                { l: 'Parcelas', v: S.pc }, { l: 'Outras despesas', v: S.ox }, { l: 'Gastos dos dias', v: S.days },
              ]} />
            </>
          ) : <T muted>Preencha a página de Finanças deste mês para ver o gráfico.</T>}
        </Card>
        <Card title="Saldo mês a mês" style={half}>
          {months.some((x) => x.any) ? (
            <View style={{ gap: 8 }}>
              {months.map((x) => {
                const mx = Math.max(1, ...months.map((z) => Math.abs(z.v)));
                return (
                  <Row key={x.l}>
                    <Text style={st.ml}>{x.l}</Text>
                    <View style={st.track}><View style={[st.fill, { width: `${(Math.abs(x.v) / mx) * 100}%`, backgroundColor: x.v < 0 ? C.danger : C.ok }]} /></View>
                    <Text style={st.mv}>{x.any ? brl(x.v) : '–'}</Text>
                  </Row>
                );
              })}
            </View>
          ) : <T muted>Os saldos dos últimos 6 meses aparecem aqui.</T>}
        </Card>
      </View>

      <Card title="Humor do mês">
        <View style={st.strip}>
          {days.map((x, i) => <View key={i} style={[st.mc, { backgroundColor: x.mood ? MOODC[x.mood - 1] : C.sand }]} accessibilityLabel={`${i + 1}: ${x.mood ? MOODN[x.mood - 1] : 'sem humor'}`} />)}
        </View>
        <Row style={{ flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {MOODN.map((nm, i) => <Row key={nm} style={{ gap: 4 }}><View style={[st.dot, { backgroundColor: MOODC[i] }]} /><T small>{nm} <Text style={{ fontFamily: F.bodySemi }}>{counts[i]}</Text></T></Row>)}
        </Row>
      </Card>

      <View style={wide ? st.cols : null}>
        <Card title="Metas e tarefas por dia" style={half}>
          {days.some((x) => x.total) ? (
            <>
              <VBars items={days.map((x) => ({ v: x.done, g: x.total }))} max={maxT} color={strong} />
              <Row style={{ gap: 14, marginTop: 8 }}>
                <Row style={{ gap: 4 }}><View style={[st.dot, { backgroundColor: strong }]} /><T small>feitas</T></Row>
                <Row style={{ gap: 4 }}><View style={[st.dot, { backgroundColor: C.sand }]} /><T small>planejadas</T></Row>
              </Row>
            </>
          ) : <T muted>Marque metas e tarefas nas páginas dos dias para ver o gráfico.</T>}
        </Card>
        <Card title="Água por dia" style={half}>
          {days.some((x) => x.water) ? <VBars items={days.map((x) => ({ v: x.water }))} max={8} color={CATSTRONG[0]} /> : <T muted>Marque os copos de água nas páginas dos dias para ver o gráfico.</T>}
        </Card>
      </View>

      <View style={wide ? st.cols : null}>
        <Card title="Hábitos do mês" style={half}>
          {hs.length ? (
            <>
              <HBars items={hs} fmt={(v) => v + '%'} color={CATSTRONG[2]} max={100} />
              <T muted small style={{ marginTop: 8 }}>Porcentagem dos dias {passed && passed < n ? 'que já passaram' : 'do mês'} em que você marcou o hábito.</T>
            </>
          ) : <T muted>Crie seus hábitos na aba Hábitos para ver o gráfico.</T>}
        </Card>
        <Card title="Gastos por categoria" style={half}>
          {cats.length ? <HBars items={cats} fmt={brl} color={CATSTRONG[3]} /> : <T muted>Os gastos variáveis, parcelas e outras despesas do mês aparecem aqui.</T>}
        </Card>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  cols: { flexDirection: 'row', gap: 12 },
  big: { fontFamily: F.title, fontSize: 34, color: C.ink },
  ml: { fontFamily: F.body, fontSize: 13, color: C.muted, width: 52 },
  mv: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink, width: 104, textAlign: 'right', fontVariant: ['tabular-nums'] },
  track: { flex: 1, height: 10, backgroundColor: C.sand, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  strip: { flexDirection: 'row', gap: 2 },
  mc: { flex: 1, height: 28, borderRadius: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
