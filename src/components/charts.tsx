import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { MOODC, MOODN } from '@/lib/planner';
import { C, F } from '@/lib/theme';

const pct = (x: number) => (x * 100).toFixed(0) + '%';

/** Barras deitadas com rótulo e valor (finanças, categorias, hábitos). */
export function HBars({ items, fmt, color = C.accent, max }: { items: { l: string; v: number }[]; fmt: (v: number) => string; color?: string; max?: number }) {
  const mx = max ?? Math.max(1, ...items.map((x) => x.v));
  return (
    <View style={{ gap: 10 }}>
      {items.map((x) => (
        <View key={x.l} accessibilityLabel={`${x.l}: ${fmt(x.v)}`}>
          <View style={st.hRow}>
            <Text style={st.hL} numberOfLines={1}>{x.l}</Text>
            <Text style={st.hV}>{fmt(x.v)}</Text>
          </View>
          <View style={st.track}><View style={[st.fill, { width: `${Math.min(100, (x.v / mx) * 100)}%`, backgroundColor: color }]} /></View>
        </View>
      ))}
    </View>
  );
}

/** Colunas por dia do mês. "g" desenha a meta (planejadas) atrás do valor (feitas). */
export function VBars({ items, max, color = C.accent, ghost = C.sand, height = 120 }: { items: { v: number; g?: number }[]; max: number; color?: string; ghost?: string; height?: number }) {
  const n = items.length;
  return (
    <View>
      <View style={[st.vWrap, { height }]}>
        {items.map((x, i) => (
          <View key={i} style={st.vCol}>
            {x.g ? <View style={[st.vBar, { height: `${(x.g / max) * 100}%`, backgroundColor: ghost, position: 'absolute', bottom: 0, left: 0, right: 0 }]} /> : null}
            <View style={[st.vBar, { height: `${(x.v / max) * 100}%`, backgroundColor: color }]} />
          </View>
        ))}
      </View>
      <View style={st.vAxis}>
        {items.map((_, i) => <Text key={i} style={st.vAxT}>{i === 0 || (i + 1) % 5 === 0 || i === n - 1 ? i + 1 : ''}</Text>)}
      </View>
    </View>
  );
}

/** Flor do sentir: uma pétala por emoção, maior quanto mais vezes ela apareceu. */
export function Flower({ counts, size = 300 }: { counts: number[]; size?: number }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const mx = Math.max(1, ...counts);
  return (
    <Svg width="100%" height={size} viewBox="-260 -215 520 430" accessibilityLabel="Flor do sentir">
      {MOODN.map((nm, i) => {
        const ang = -90 + i * 60, c = counts[i];
        const r = total ? (c ? 70 + 70 * (c / mx) : 56) : 104, w = r * 0.36, b0 = 30;
        const d = `M0 ${-b0} C${w} ${-b0 - r * 0.25} ${w * 1.05} ${-b0 - r * 0.75} 0 ${-b0 - r} C${-w * 1.05} ${-b0 - r * 0.75} ${-w} ${-b0 - r * 0.25} 0 ${-b0}Z`;
        const lr = Math.max(b0 + r, 96) + 16, rad = (ang * Math.PI) / 180, x = Math.cos(rad) * lr, y = Math.sin(rad) * lr;
        const anc = Math.abs(x) < 10 ? 'middle' : x > 0 ? 'start' : 'end';
        return (
          <G key={nm}>
            <Path d={d} transform={`rotate(${ang + 90})`} fill={MOODC[i]} opacity={c || !total ? 0.95 : 0.18} />
            <SvgText x={x} y={y - 2} textAnchor={anc} fontSize={15} fill={C.ink} fontFamily={F.bodyMed}>{nm}</SvgText>
            <SvgText x={x} y={y + 15} textAnchor={anc} fontSize={13} fill={C.muted} fontFamily={F.body}>{total ? pct(c / total) : '–'}</SvgText>
          </G>
        );
      })}
      <Circle r={24} fill={C.surface} stroke={C.line} />
    </Svg>
  );
}

/** Roda da vida (radar) com as notas de 0 a 10. */
export function Radar({ labels, values, color, size = 320 }: { labels: string[]; values: number[]; color: string; size?: number }) {
  const N = labels.length, R = 120;
  const pt = (i: number, r: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / N; return [Math.cos(a) * r, Math.sin(a) * r]; };
  const poly = (f: (i: number) => number) => labels.map((_, i) => pt(i, f(i)).map((v) => v.toFixed(1)).join(',')).join(' ');
  return (
    <Svg width="100%" height={size} viewBox="-250 -175 500 350" accessibilityLabel="Roda da vida">
      {[2, 4, 6, 8, 10].map((k) => <Polygon key={k} points={poly(() => (R * k) / 10)} fill="none" stroke={C.line} strokeWidth={1} />)}
      {labels.map((l, i) => {
        const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 16);
        const anc = Math.abs(lx) < 12 ? 'middle' : lx > 0 ? 'start' : 'end';
        return (
          <G key={l}>
            <Line x1={0} y1={0} x2={x} y2={y} stroke={C.line} />
            <SvgText x={lx} y={ly + 4} textAnchor={anc} fontSize={12} fill={C.muted} fontFamily={F.body}>{l} · {values[i]}</SvgText>
          </G>
        );
      })}
      <Polygon points={poly((i) => (R * values[i]) / 10)} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />
      {labels.map((l, i) => { const [x, y] = pt(i, (R * values[i]) / 10); return <Circle key={l} cx={x} cy={y} r={4} fill={color} />; })}
    </Svg>
  );
}

const st = StyleSheet.create({
  hRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  hL: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.ink },
  hV: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink, fontVariant: ['tabular-nums'] },
  track: { height: 10, backgroundColor: C.sand, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  vWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  vCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  vBar: { borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 0 },
  vAxis: { flexDirection: 'row', gap: 2, marginTop: 4 },
  vAxT: { flex: 1, textAlign: 'center', fontFamily: F.body, fontSize: 9, color: C.muted },
});
