import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { success, tap } from '@/lib/actions';
import { uid } from '@/lib/planner';
import { Btn, Field, Fold, IconBtn, Row, T } from './ui';
import { C, F, R } from '@/lib/theme';

/**
 * Rotina da manhã e da noite: passos em sequência, um de cada vez.
 * Passos em t-rotinas.{manha|noite} = [{ id, t }]; o que foi feito no dia em d-.rot.{id}.
 */
export type Step = { id: string; t: string };
const SUGESTAO: Record<'manha' | 'noite', string[]> = {
  manha: ['Beber um copo de água', 'Arrumar a cama', 'Escovar os dentes', 'Olhar as 3 prioridades de hoje'],
  noite: ['Esvaziar a caixa de entrada', 'Escolher as prioridades de amanhã', 'Separar a roupa de amanhã', 'Celular longe da cama'],
};

export function Routine({ kind, dayId, color }: { kind: 'manha' | 'noite'; dayId: string; color: string }) {
  const raw = useStore((s) => s.docs['t-rotinas']?.[kind]);
  const done = useStore((s) => s.docs[dayId]?.rot);
  const { set, push, remove } = useStore.getState();
  const steps: Step[] = Array.isArray(raw) ? raw.filter((x: Step) => x && x.id) : [];
  const [edit, setEdit] = useState(false);
  const [novo, setNovo] = useState('');
  const ok = (sid: string) => !!done?.[sid];
  const n = steps.filter((x) => ok(x.id)).length;
  const next = steps.find((x) => !ok(x.id));
  const title = kind === 'manha' ? 'Rotina da manhã' : 'Rotina da noite';

  function flip(sid: string) {
    const v = !ok(sid);
    set(dayId, `rot.${sid}`, v);
    if (v) (steps.every((x) => x.id === sid || ok(x.id)) ? success : tap)();
  }
  function add() {
    const v = novo.trim();
    if (!v) return;
    push('t-rotinas', kind, { id: uid('s'), t: v });
    setNovo('');
  }

  return (
    <Fold id={`dia-rot-${kind}`} title={title} icon={kind === 'manha' ? 'partly-sunny-outline' : 'moon-outline'} color={color}
      summary={steps.length ? (n === steps.length ? 'tudo feito' : `${n} de ${steps.length} · agora: ${next?.t}`) : 'monte seus passos'}
      right={steps.length ? <Text style={st.count}>{n}/{steps.length}</Text> : null}>
      {!steps.length && !edit ? (
        <>
          <T muted style={{ marginBottom: 10 }}>Uma sequência curta que você faz sem pensar. Comece com 3 ou 4 passos.</T>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            <Btn kind="soft" title="Usar sugestão" color={color} onPress={() => set('t-rotinas', kind, SUGESTAO[kind].map((t) => ({ id: uid('s'), t })))} />
            <Btn kind="link" title="Montar do zero" color={C.accent} onPress={() => setEdit(true)} />
          </Row>
        </>
      ) : edit ? (
        <View style={{ gap: 4 }}>
          {steps.map((x, i) => (
            <Row key={x.id}>
              <Text style={[st.num, { color }]}>{i + 1}</Text>
              <Field doc="t-rotinas" path={`${kind}.${i}.t`} style={{ minHeight: 38 }} />
              <IconBtn icon="close" label="Apagar passo" onPress={() => remove('t-rotinas', kind, i)} size={16} />
            </Row>
          ))}
          <Row>
            <Ionicons name="add" size={18} color={color} />
            <TextInput value={novo} onChangeText={setNovo} onSubmitEditing={add} blurOnSubmit={false} returnKeyType="done" placeholder="Novo passo"
              placeholderTextColor="#A39A90" style={st.newIn} accessibilityLabel="Novo passo" />
          </Row>
          <Btn kind="soft" title="Pronto" onPress={() => setEdit(false)} color={C.ink} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {steps.map((x, i) => {
            const isNext = next?.id === x.id;
            return (
              <Pressable key={x.id} onPress={() => flip(x.id)} accessibilityRole="checkbox" accessibilityState={{ checked: ok(x.id) }}
                style={[st.step, isNext && { borderColor: color, backgroundColor: C.surface }, !isNext && !ok(x.id) && { opacity: 0.6 }]}>
                <View style={[st.dot, { borderColor: color }, ok(x.id) && { backgroundColor: color }]}>
                  {ok(x.id) ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[st.dotN, { color }]}>{i + 1}</Text>}
                </View>
                <Text style={[st.stepT, ok(x.id) && st.done, isNext && { fontFamily: F.bodyMed }]}>{x.t}</Text>
                {isNext ? <Text style={[st.now, { color }]}>agora</Text> : null}
              </Pressable>
            );
          })}
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
            {n ? <Btn kind="link" title="Recomeçar" color={C.muted} onPress={() => set(dayId, 'rot', Object.fromEntries(Object.entries(done || {}).filter(([k]) => !steps.some((x) => x.id === k))))} /> : <View />}
            <Btn kind="link" title="Editar passos" color={C.accent} onPress={() => setEdit(true)} />
          </Row>
        </View>
      )}
    </Fold>
  );
}

const st = StyleSheet.create({
  count: { fontFamily: F.bodyMed, fontSize: 13, color: C.muted },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 12, minHeight: 48, backgroundColor: C.bg },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dotN: { fontFamily: F.bodySemi, fontSize: 12 },
  stepT: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
  now: { fontFamily: F.bodySemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  done: { textDecorationLine: 'line-through', color: C.muted },
  num: { fontFamily: F.title, fontSize: 18, width: 16 },
  newIn: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.ink, minHeight: 38, borderBottomWidth: 1, borderBottomColor: C.hair },
});
