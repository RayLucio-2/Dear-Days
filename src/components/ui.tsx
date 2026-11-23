import React, { useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, F, R } from '@/lib/theme';
import { useStore } from '@/lib/store';
import { tap } from '@/lib/actions';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.wrap}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[s.wrap, { flex: 1, padding: 16 }]}>{children}</View>
  );
  return <SafeAreaView edges={['top']} style={s.safe}>{body}</SafeAreaView>;
}

export function H1({ children, sub, color }: { children: React.ReactNode; sub?: string; color?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {sub ? <Text style={[s.eyebrow, color ? { color } : null]}>{sub}</Text> : null}
      <Text style={s.h1}>{children}</Text>
    </View>
  );
}

export function Card({ title, children, style, right, tint }: { title?: string; children: React.ReactNode; style?: ViewStyle; right?: React.ReactNode; tint?: string }) {
  return (
    <View style={[s.card, tint ? { borderTopColor: tint, borderTopWidth: 4 } : null, style]}>
      {title ? (
        <View style={s.cardHead}>
          <Text style={s.h2}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Título de seção entre grupos de cartões. */
export function Section({ title, color }: { title: string; color?: string }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionT, color ? { color } : null]}>{title}</Text>
    </View>
  );
}

/**
 * Cartão que abre e fecha. Fechado, mostra só o título e um resumo.
 * Fica lembrado em t-cfg (app.fechados), então vale no celular e no site.
 */
export function Fold({ id, title, summary, children, right, icon, color = C.muted, startClosed = false }: {
  id: string; title: string; summary?: string; children: React.ReactNode; right?: React.ReactNode; icon?: any; color?: string; startClosed?: boolean;
}) {
  const saved = useStore((st) => st.get('t-cfg', `app.fechados.${id}`));
  const set = useStore((st) => st.set);
  const closed = saved == null ? startClosed : !!saved;
  const hidden = !!useStore((st) => st.get('t-cfg', `app.ocultos.${id}`));
  if (hidden) return null; // a pessoa escolheu esconder este cartão
  return (
    <View style={[s.card, closed && s.cardClosed]}>
      <Pressable onPress={() => set('t-cfg', `app.fechados.${id}`, !closed)} accessibilityRole="button" accessibilityState={{ expanded: !closed }}
        accessibilityLabel={`${title}${closed ? ', fechado' : ''}`} hitSlop={6} style={[s.foldHead, !closed && { marginBottom: 14 }]}>
        {icon ? <Ionicons name={icon} size={18} color={color} style={{ opacity: 0.75 }} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={s.h2}>{title}</Text>
          {closed && summary ? <Text style={s.foldSum} numberOfLines={1}>{summary}</Text> : null}
        </View>
        {right}
        <Ionicons name={closed ? 'chevron-down' : 'chevron-up'} size={16} color={C.faint} />
      </Pressable>
      {closed ? null : children}
    </View>
  );
}

export const T = ({ children, style, muted, small }: { children: React.ReactNode; style?: any; muted?: boolean; small?: boolean }) => (
  <Text style={[s.t, muted && { color: C.muted }, small && { fontSize: 12 }, style]}>{children}</Text>
);

/**
 * Campo de texto ligado a um doc. Guarda o texto local enquanto digita
 * e grava no store (o store já espera um pouco antes de enviar).
 */
export function Field({ doc, path, style, time, ...p }: { doc: string; path: string; time?: boolean } & TextInputProps) {
  const val = useStore((st) => st.get(doc, path));
  const set = useStore((st) => st.set);
  const stored = val == null ? '' : String(val);
  // Enquanto digita, mostra o texto local; fora do foco, o valor salvo (que pode vir de outro aparelho).
  const [txt, setTxt] = useState(stored);
  const [focus, setFocus] = useState(false);
  const timeProps: TextInputProps = time ? { keyboardType: 'number-pad', maxLength: 5, placeholder: p.placeholder ?? '--:--' } : {};
  return (
    <TextInput
      {...timeProps}
      value={focus ? txt : stored}
      onChangeText={(t) => { const v = time ? formatTime(t) : t; setTxt(v); set(doc, path, v); }}
      onFocus={() => { setTxt(stored); setFocus(true); }}
      onBlur={() => setFocus(false)}
      placeholderTextColor={C.placeholder}
      style={[s.input, p.multiline && s.multi, style]}
      {...p}
    />
  );
}

/** Caixinha de marcar com vibração leve e um pulinho quando marca. */
export function Check({ on, onPress, color = C.ink, label }: { on: boolean; onPress: () => void; color?: string; label?: string }) {
  const [scale] = useState(() => new Animated.Value(1));
  function press() {
    if (!on) {
      tap();
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: Platform.OS !== 'web' }).start();
    }
    onPress();
  }
  return (
    <Pressable onPress={press} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label}>
      <Animated.View style={[s.check, { borderColor: color, transform: [{ scale }] }, on && { backgroundColor: color }]}>
        {on ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
      </Animated.View>
    </Pressable>
  );
}

/** Caixa de seleção ligada a um doc. */
export function DocCheck({ doc, path, color, label }: { doc: string; path: string; color?: string; label?: string }) {
  const on = !!useStore((st) => st.get(doc, path));
  const set = useStore((st) => st.set);
  return <Check on={on} onPress={() => set(doc, path, !on)} color={color} label={label} />;
}

export function Btn({ title, onPress, kind = 'solid', icon, color = C.ink, disabled, style }: {
  title: string; onPress: () => void; kind?: 'solid' | 'soft' | 'link'; icon?: any; color?: string; disabled?: boolean; style?: ViewStyle;
}) {
  const solid = kind === 'solid';
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        solid ? { backgroundColor: color } : kind === 'soft' ? { backgroundColor: C.sand } : { paddingHorizontal: 0, minHeight: 32 },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={16} color={solid ? '#fff' : color} /> : null}
      <Text style={[s.btnT, { color: solid ? '#fff' : color }]}>{title}</Text>
    </Pressable>
  );
}

export function IconBtn({ icon, onPress, label, color = C.muted, size = 20 }: { icon: any; onPress: () => void; label: string; color?: string; size?: number }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.5 }]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.row, style]}>{children}</View>;
}

export function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.total}>
      <Text style={[s.t, strong && { fontFamily: F.bodySemi }]}>{label}</Text>
      <Text style={[s.t, s.num, strong && { fontFamily: F.bodySemi }]}>{value}</Text>
    </View>
  );
}

/** "0830" -> "08:30" enquanto digita. */
export function formatTime(t: string) {
  const d = t.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + ':' + d.slice(2);
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }, // espaço para o botão +
  wrap: { width: '100%', maxWidth: 780, alignSelf: 'center' },
  eyebrow: { fontFamily: F.body, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: C.muted, marginBottom: 4 },
  h1: { fontFamily: F.title, fontSize: 34, color: C.ink, lineHeight: 40, letterSpacing: -0.3 },
  h2: { fontFamily: F.title, fontSize: 20, color: C.ink, letterSpacing: -0.1 },
  t: { fontFamily: F.body, fontSize: 15, color: C.ink, lineHeight: 21 },
  num: { fontVariant: ['tabular-nums'] },
  // cartões sem borda nem sombra: só o branco sobre o creme
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: 20, marginBottom: 14 },
  cardClosed: { paddingVertical: 16, backgroundColor: C.glass },
  foldHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 30 },
  foldIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  foldSum: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 2 },
  section: { marginTop: 22, marginBottom: 10, paddingHorizontal: 4 },
  sectionT: { fontFamily: F.bodyMed, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, opacity: 0.85 },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.hair },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  input: { fontFamily: F.body, fontSize: 15, color: C.ink, borderBottomWidth: 1, borderBottomColor: C.hair, paddingVertical: 9, minHeight: 42, flex: 1 },
  multi: { minHeight: 84, textAlignVertical: 'top', borderWidth: 0, borderRadius: R.md, padding: 12, backgroundColor: C.field, lineHeight: 22 },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btn: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingHorizontal: 18, minHeight: 42 },
  btnT: { fontFamily: F.bodyMed, fontSize: 14 },
  iconBtn: { padding: 6, minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  total: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.hair, paddingTop: 12, marginTop: 10 },
});
