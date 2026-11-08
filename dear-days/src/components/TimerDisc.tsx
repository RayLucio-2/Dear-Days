import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTimer } from '@/lib/timer';
import { success } from '@/lib/actions';
import { Btn, Row } from './ui';
import { C, F } from '@/lib/theme';

/** Fatia de pizza que começa cheia e vai diminuindo (como um "time timer"). */
function pie(f: number, r: number, c: number) {
  if (f >= 0.9999) return null;
  const a = f * 2 * Math.PI;
  const x = c + r * Math.sin(a), y = c - r * Math.cos(a);
  return `M ${c} ${c} L ${c} ${c - r} A ${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y} Z`;
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function TimerDisc({ color, size = 140, hint }: { color: string; size?: number; hint?: string }) {
  const run = useTimer((t) => t.run);
  const { more, stop } = useTimer.getState();
  const [now, setNow] = useState(() => Date.now());
  const warned = useRef(false);

  useEffect(() => {
    if (!run) return;
    warned.current = false;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [run]);

  const left = run ? run.dur - (now - run.startAt) : 0;
  const over = !!run && left <= 0;
  useEffect(() => {
    if (over && !warned.current) { warned.current = true; success(); }
  }, [over]);

  if (!run) return null;
  const f = Math.max(0, Math.min(1, left / run.dur));
  const c = size / 2, r = c - 6;
  const p = pie(f, r, c);

  return (
    <View style={st.wrap} accessibilityLabel={over ? 'Tempo acabou' : `Faltam ${fmt(left)}`} accessibilityLiveRegion="polite">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r} fill={C.sand} />
          {over ? null : p ? <Path d={p} fill={color} opacity={0.85} /> : <Circle cx={c} cy={c} r={r} fill={color} opacity={0.85} />}
          <Circle cx={c} cy={c} r={r * 0.42} fill={C.surface} />
        </Svg>
        <View style={[StyleSheet.absoluteFill, st.center]}>
          <Text style={st.time}>{over ? 'pronto' : fmt(left)}</Text>
        </View>
      </View>
      <Text style={st.msg}>{over ? 'Você começou, isso é o mais difícil. Quer continuar?' : hint || run.label}</Text>
      <Row style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {over ? <Btn title="Mais 5 min" icon="add" onPress={() => more(5)} color={color} /> : <Btn kind="soft" title="+5 min" onPress={() => more(5)} color={C.ink} />}
        <Btn kind="soft" title={over ? 'Parar por aqui' : 'Parar'} icon="stop-outline" onPress={stop} color={C.ink} />
      </Row>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  center: { alignItems: 'center', justifyContent: 'center' },
  time: { fontFamily: F.bodySemi, fontSize: 22, color: C.ink, fontVariant: ['tabular-nums'] },
  msg: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center' },
});
