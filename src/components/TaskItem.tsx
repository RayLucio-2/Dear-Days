import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { CATN, CATS, CATSTRONG, ENERGIA, ENERGIA_ICON, Sub, Task } from '@/lib/planner';
import { moveTask, success, tap, tomorrowOf } from '@/lib/actions';
import { openGcal } from '@/lib/gcal';
import { Check, DocCheck, Field, IconBtn, Row, T } from './ui';
import { C, F, R } from '@/lib/theme';

/** Marca ou desmarca uma subtarefa. Quando todas ficam feitas, a tarefa também fica. */
export function toggleSub(id: string, i: number, j: number) {
  const { get, set } = useStore.getState();
  const sub: Sub[] = (get(id, `tl.${i}.sub`) || []).map((x: Sub) => ({ ...x }));
  if (!sub[j]) return;
  sub[j].ok = !sub[j].ok;
  set(id, `tl.${i}.sub`, sub);
  const all = sub.length > 0 && sub.every((x) => x.ok);
  if (sub[j].ok) (all ? success : tap)();
  if (all !== !!get(id, `tl.${i}.ok`)) set(id, `tl.${i}.ok`, all);
}

export function subCount(t: Task) {
  const l = Array.isArray(t.sub) ? t.sub.filter((x) => x && String(x.t || '').trim()) : [];
  return { done: l.filter((x) => x.ok).length, total: l.length };
}

/** Lista de subtarefas para marcar (usada na lista e no modo foco). */
export function SubList({ id, i, t, color, big }: { id: string; i: number; t: Task; color: string; big?: boolean }) {
  const subs = (Array.isArray(t.sub) ? t.sub : []).map((x, j) => ({ ...x, j })).filter((x) => String(x.t || '').trim());
  if (!subs.length) return null;
  const next = subs.find((x) => !x.ok)?.j;
  return (
    <View style={{ gap: big ? 10 : 4, marginTop: big ? 4 : 2 }}>
      {subs.map((x) => (
        <Pressable key={x.j} onPress={() => toggleSub(id, i, x.j)} accessibilityRole="checkbox" accessibilityState={{ checked: !!x.ok }}
          style={[st.sub, big && st.subBig, big && x.j === next && { borderColor: color, backgroundColor: C.surface }]}>
          <Ionicons name={x.ok ? 'checkbox' : 'square-outline'} size={big ? 22 : 18} color={x.ok ? color : C.muted} />
          <Text style={[st.subT, big && { fontSize: 16 }, x.ok && st.done]}>{x.t}</Text>
          {big && x.j === next ? <Text style={[st.nextTag, { color }]}>agora</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

/** Tarefa compacta: título, horário e subtarefas. Toque na seta para editar o resto. */
export function TaskItem({ id, i, t, strong, onRepeat, startOpen }: { id: string; i: number; t: Task; strong: string; onRepeat: () => void; startOpen?: boolean }) {
  const [open, setOpen] = useState(!!startOpen);
  const [novo, setNovo] = useState('');
  const { set, push, remove } = useStore.getState();
  const cat = t.cat || 0;
  const sc = subCount(t);
  const time = t.time ? `${t.time}${t.end ? '–' + t.end : ''}` : '';
  const est = Number(t.est || 0), real = Number(t.real || 0);
  const en = t.en == null ? null : Number(t.en);
  const day = id.slice(2);

  function addSub() {
    const v = novo.trim();
    if (!v) return;
    push(id, `tl.${i}.sub`, { t: v, ok: false });
    if (t.ok) set(id, `tl.${i}.ok`, false);
    setNovo('');
  }

  return (
    <View style={[st.wrap, { borderLeftColor: CATSTRONG[cat] }, t.ok && { opacity: 0.75 }]}>
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ paddingTop: 9 }}><DocCheck doc={id} path={`tl.${i}.ok`} color={strong} label="Tarefa feita" /></View>
        <View style={{ flex: 1 }}>
          <Field doc={id} path={`tl.${i}.t`} placeholder="O que precisa fazer?" style={[st.title, t.ok && st.done]} />
          {time || sc.total || est || real || en != null || (!open && t.desc) ? (
            <Row style={{ gap: 6, flexWrap: 'wrap', marginTop: -2, marginBottom: 4 }}>
              {time ? <View style={[st.chip, { backgroundColor: CATS[cat] }]}><Ionicons name="time-outline" size={12} color={C.ink} /><Text style={st.chipT}>{time}</Text></View> : null}
              {sc.total ? <View style={[st.chip, { backgroundColor: C.sand }]}><Ionicons name="list-outline" size={12} color={C.ink} /><Text style={st.chipT}>{sc.done}/{sc.total}</Text></View> : null}
              {est || real ? <View style={[st.chip, { backgroundColor: C.sand }]}><Ionicons name="hourglass-outline" size={12} color={C.ink} /><Text style={st.chipT}>{real ? `levou ${real}${est ? ` de ~${est}` : ''} min` : `~${est} min`}</Text></View> : null}
              {en != null ? <View style={[st.chip, { backgroundColor: C.sand }]}><Ionicons name={ENERGIA_ICON[en] as any} size={12} color={C.ink} /><Text style={st.chipT}>{ENERGIA[en]}</Text></View> : null}
              {!open && t.desc ? <Text style={st.desc} numberOfLines={1}>{t.desc}</Text> : null}
            </Row>
          ) : null}
          {!open && t.first && !t.ok ? <Text style={st.first} numberOfLines={1}><Text style={{ fontFamily: F.bodySemi }}>Comece: </Text>{t.first}</Text> : null}
        </View>
        <IconBtn icon={open ? 'chevron-up' : 'chevron-down'} label={open ? 'Fechar detalhes' : 'Abrir detalhes'} onPress={() => setOpen(!open)} size={18} />
      </Row>

      {!open ? (
        <View style={{ paddingLeft: 32 }}><SubList id={id} i={i} t={t} color={strong} /></View>
      ) : (
        <View style={st.edit}>
          <Row>
            <Ionicons name="time-outline" size={16} color={C.muted} />
            <Field doc={id} path={`tl.${i}.time`} time placeholder="Início" style={st.tm} />
            <T muted small>até</T>
            <Field doc={id} path={`tl.${i}.end`} time placeholder="Fim" style={st.tm} />
          </Row>
          <Row>
            <Ionicons name="color-palette-outline" size={16} color={C.muted} />
            {CATS.map((c, j) => (
              <Pressable key={c} onPress={() => set(id, `tl.${i}.cat`, j)} accessibilityLabel={`Cor ${CATN[j]}`} accessibilityState={{ selected: cat === j }}
                style={[st.cat, { backgroundColor: c }, cat === j && { borderColor: CATSTRONG[j] }]} />
            ))}
          </Row>
          <Field doc={id} path={`tl.${i}.desc`} placeholder="Detalhes (opcional)" style={{ fontSize: 14 }} />

          <Text style={st.label}>Primeiro passo</Text>
          <Field doc={id} path={`tl.${i}.first`} placeholder="O menor passo possível. Ex.: abrir o notebook" style={{ fontSize: 14 }} />

          <Text style={st.label}>Quanto tempo vai levar</Text>
          <Row style={{ flexWrap: 'wrap', gap: 6 }}>
            {[5, 15, 30, 45, 60, 90].map((m) => (
              <Pressable key={m} onPress={() => set(id, `tl.${i}.est`, est === m ? undefined : m)} accessibilityRole="button" accessibilityState={{ selected: est === m }}
                style={[st.opt, est === m && { backgroundColor: strong, borderColor: strong }]}>
                <Text style={[st.optT, est === m && { color: '#fff' }]}>{m < 60 ? `${m} min` : `${m / 60}h`.replace('.5', ',5')}</Text>
              </Pressable>
            ))}
          </Row>
          {real ? <T muted small>Levou {real} min{est ? `, você estimou ${est}` : ''}.</T> : null}

          <Text style={st.label}>Energia que pede</Text>
          <Row style={{ gap: 6 }}>
            {ENERGIA.map((n, j) => (
              <Pressable key={n} onPress={() => set(id, `tl.${i}.en`, en === j ? undefined : j)} accessibilityRole="button" accessibilityState={{ selected: en === j }}
                style={[st.opt, { flexDirection: 'row', gap: 4 }, en === j && { backgroundColor: strong, borderColor: strong }]}>
                <Ionicons name={ENERGIA_ICON[j] as any} size={14} color={en === j ? '#fff' : C.muted} />
                <Text style={[st.optT, en === j && { color: '#fff' }]}>{n}</Text>
              </Pressable>
            ))}
          </Row>

          <Text style={st.label}>Subtarefas</Text>
          {(Array.isArray(t.sub) ? t.sub : []).map((x, j) => (
            <Row key={j}>
              <Check on={!!x?.ok} onPress={() => toggleSub(id, i, j)} color={strong} label="Subtarefa feita" />
              <Field doc={id} path={`tl.${i}.sub.${j}.t`} style={[{ fontSize: 14, minHeight: 36 }, x?.ok && st.done]} />
              <IconBtn icon="close" label="Apagar subtarefa" onPress={() => remove(id, `tl.${i}.sub`, j)} size={16} />
            </Row>
          ))}
          <Row>
            <Ionicons name="add" size={18} color={strong} />
            <TextInput value={novo} onChangeText={setNovo} onSubmitEditing={addSub} blurOnSubmit={false} returnKeyType="done"
              placeholder="Quebrar em um passo pequeno" placeholderTextColor={C.placeholder} style={[st.newSub]} accessibilityLabel="Nova subtarefa" />
            {novo.trim() ? <IconBtn icon="checkmark" label="Adicionar subtarefa" onPress={addSub} color={strong} /> : null}
          </Row>

          <Row style={{ justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap' }}>
            <Pressable onPress={() => moveTask(day, i, tomorrowOf(day))} style={st.action} accessibilityRole="button"><Ionicons name="arrow-forward-circle-outline" size={16} color={C.accent} /><Text style={[st.actionT, { color: C.accent }]}>Amanhã</Text></Pressable>
            <Pressable onPress={onRepeat} style={st.action} accessibilityRole="button"><Ionicons name="repeat" size={16} color={C.accent} /><Text style={[st.actionT, { color: C.accent }]}>Repetir todo dia</Text></Pressable>
            {t.t ? (
              <Pressable onPress={() => openGcal({ title: String(t.t), day, start: t.time, end: t.end, details: [t.first ? `Primeiro passo: ${t.first}` : '', t.desc || ''].filter(Boolean).join('\n') })}
                style={st.action} accessibilityRole="link" accessibilityLabel="Adicionar ao Google Agenda">
                <Ionicons name="calendar-outline" size={16} color={C.accent} /><Text style={[st.actionT, { color: C.accent }]}>Google Agenda</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => remove(id, 'tl', i)} style={st.action} accessibilityRole="button"><Ionicons name="trash-outline" size={16} color={C.muted} /><Text style={[st.actionT, { color: C.muted }]}>Apagar</Text></Pressable>
          </Row>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderLeftWidth: 3, paddingLeft: 10, paddingBottom: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: C.hair },
  title: { borderBottomWidth: 0, fontFamily: F.bodyMed, fontSize: 15 },
  done: { textDecorationLine: 'line-through', color: C.muted },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  chipT: { fontFamily: F.bodyMed, fontSize: 12, color: C.ink },
  desc: { fontFamily: F.body, fontSize: 12, color: C.muted, flexShrink: 1 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  subBig: { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.bg },
  subT: { fontFamily: F.body, fontSize: 14, color: C.ink, flex: 1 },
  nextTag: { fontFamily: F.bodySemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  edit: { paddingLeft: 32, gap: 6, paddingBottom: 6 },
  tm: { flex: 0, width: 64, textAlign: 'center', minHeight: 34, paddingVertical: 4 },
  cat: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  label: { fontFamily: F.bodySemi, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
  newSub: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.ink, minHeight: 38, borderBottomWidth: 1, borderBottomColor: C.hair, borderStyle: 'dashed' },
  first: { fontFamily: F.body, fontSize: 13, color: C.ink, marginBottom: 4 },
  opt: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  optT: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  actionT: { fontFamily: F.bodyMed, fontSize: 13 },
});
