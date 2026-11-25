import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PACOTES } from '@/lib/modelos';
import { success } from '@/lib/actions';
import { useStore } from '@/lib/store';
import { addDays, DIAS, fromKey, key, today } from '@/lib/dates';
import { openGcal } from '@/lib/gcal';
import { CATN, CATS, CATSTRONG, monthColor, Rule, uid } from '@/lib/planner';
import { useWide } from '@/lib/layout';

import { Btn, Field, H1, IconBtn, Row, Screen, T } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/** Primeiro dia (a partir de hoje ou do início da tarefa) que cai num dos dias escolhidos. */
function nextOn(days: number[], from?: string) {
  let d = today();
  if (from && fromKey(from) > d) d = fromKey(from);
  for (let i = 0; i < 7; i++) { const x = addDays(d, i); if (days.includes(x.getDay())) return key(x); }
  return key(d);
}

const PRE: [string, number[]][] = [['Todo dia', [0, 1, 2, 3, 4, 5, 6]], ['Seg a sex', [1, 2, 3, 4, 5]], ['Fim de semana', [0, 6]]];

/** Tarefas fixas (t-rot.r): cadastra uma vez e aparece nos dias escolhidos. */
export default function Rotina() {
  const raw = useStore((s) => s.docs['t-rot']?.r);
  const { set, push, remove } = useStore.getState();
  const wide = useWide();
  const rs: Rule[] = Array.isArray(raw) ? raw : [];
  const [, strong] = monthColor(today());

  return (
    <Screen>
      <H1 sub="Ferramenta" color={strong}>Tarefas fixas</H1>
      <T muted style={{ marginTop: -6, marginBottom: 14, lineHeight: 21 }}>
        Cadastre uma vez o que você faz quase todo dia. A tarefa aparece sozinha nos dias escolhidos, e você marca como feita em cada dia.
      </T>
      <Btn title="Nova tarefa fixa" icon="add" color={strong} style={{ alignSelf: 'flex-start', marginBottom: 14 }}
        onPress={() => push('t-rot', 'r', { id: uid('r'), t: '', time: '', end: '', desc: '', cat: 0, days: [1, 2, 3, 4, 5], from: key(today()) })} />

      <Text style={st.secT}>Modelos de rotina saudável</Text>
      <T muted small style={{ marginBottom: 10 }}>Toque para adicionar. Depois ajuste horários e dias do seu jeito, ou apague o que não servir.</T>
      <View style={st.pacotes}>
        {PACOTES.map((p) => {
          const ja = p.itens.every((it) => rs.some((r) => r?.t === it.t));
          return (
            <Pressable key={p.k} disabled={ja} accessibilityRole="button" accessibilityState={{ disabled: ja }}
              onPress={() => { p.itens.filter((it) => !rs.some((r) => r?.t === it.t)).forEach((it) => push('t-rot', 'r', { id: uid('r'), t: it.t, time: it.time || '', end: it.end || '', desc: it.desc || '', cat: it.cat || 0, days: it.days, from: key(today()) })); success(); }}
              style={[st.pacote, { width: wide ? '32%' : '100%' }, ja && { opacity: 0.55 }]}>
              <Row style={{ gap: 8 }}>
                <Ionicons name={p.icon as any} size={18} color={strong} />
                <Text style={st.pacoteN}>{p.n}</Text>
                <Ionicons name={ja ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={ja ? C.ok : strong} />
              </Row>
              <Text style={st.pacoteD}>{p.d}</Text>
              <Text style={st.pacoteI}>{p.itens.map((it) => `${it.time ? it.time + ' ' : ''}${it.t}`).join('\n')}</Text>
            </Pressable>
          );
        })}
      </View>

      {rs.length ? <Text style={[st.secT, { marginTop: 8 }]}>Suas tarefas fixas</Text> : null}
      <View style={st.list}>
        {rs.map((r, i) => {
          if (!r) return null;
          const days = Array.isArray(r.days) ? r.days.map(Number) : [];
          const c = r.cat || 0;
          return (
            <View key={r.id || i} style={[st.card, { width: wide ? '49%' : '100%', borderLeftColor: CATSTRONG[c] }]}>
              <Row>
                <Field doc="t-rot" path={`r.${i}.t`} placeholder="Tarefa (ex.: tomar água, estudar 1h)" style={{ fontFamily: F.bodyMed }} />
                <IconBtn icon="trash-outline" label="Apagar tarefa fixa" onPress={() => remove('t-rot', 'r', i)} />
              </Row>
              <Row>
                <Field doc="t-rot" path={`r.${i}.time`} time placeholder="Início" style={st.tm} />
                <T muted small>até</T>
                <Field doc="t-rot" path={`r.${i}.end`} time placeholder="Fim" style={st.tm} />
                <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
                  {CATS.map((cc, j) => (
                    <Pressable key={cc} onPress={() => set('t-rot', `r.${i}.cat`, j)} accessibilityLabel={`Cor ${CATN[j]}`} style={[st.cat, { backgroundColor: cc }, c === j && { borderColor: CATSTRONG[j] }]} />
                  ))}
                </View>
              </Row>
              <Field doc="t-rot" path={`r.${i}.desc`} placeholder="Detalhes (opcional)" style={{ fontSize: 14 }} />
              <View style={st.days}>
                {DIAS.map((dn, j) => {
                  const on = days.includes(j);
                  return (
                    <Pressable key={dn} onPress={() => set('t-rot', `r.${i}.days`, on ? days.filter((x) => x !== j) : [...days, j].sort())}
                      accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={[st.day, on && { backgroundColor: strong, borderColor: strong }]}>
                      <Text style={[st.dayT, on && { color: '#fff' }]}>{dn}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Row style={{ gap: 14, flexWrap: 'wrap' }}>
                {PRE.map(([l, ds]) => <Btn key={l} kind="link" title={l} color={C.accent} onPress={() => set('t-rot', `r.${i}.days`, ds)} />)}
                {r.t && days.length ? (
                  <Btn kind="link" title="Google Agenda" icon="calendar-outline" color={C.accent}
                    onPress={() => openGcal({ title: r.t, day: nextOn(days, r.from), start: r.time, end: r.end, details: r.desc, weekdays: days })} />
                ) : null}
              </Row>
              <T muted small>Aparece a partir de {r.from ? fromKey(r.from).toLocaleDateString('pt-BR') : 'hoje'}{days.length ? '' : '. Escolha pelo menos um dia.'}</T>
            </View>
          );
        })}
      </View>
      {!rs.length ? <T muted>Dica: na página do Dia, abra uma tarefa e toque em “Repetir todo dia” para transformá-la em tarefa fixa.</T> : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  secT: { fontFamily: F.title, fontSize: 22, color: C.ink, marginBottom: 4 },
  pacotes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 20 },
  pacote: { backgroundColor: C.surface, borderRadius: R.lg, padding: 14, gap: 6 },
  pacoteN: { flex: 1, fontFamily: F.bodySemi, fontSize: 15, color: C.ink },
  pacoteD: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 18 },
  pacoteI: { fontFamily: F.body, fontSize: 13, color: C.ink, lineHeight: 20 },
  list: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { backgroundColor: C.surface, borderRadius: R.lg, borderLeftWidth: 3, padding: 16, gap: 6 },
  tm: { flex: 0, width: 64, textAlign: 'center', minHeight: 34, paddingVertical: 4 },
  cat: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  days: { flexDirection: 'row', gap: 4, marginTop: 4 },
  day: { flex: 1, minHeight: 36, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  dayT: { fontFamily: F.bodyMed, fontSize: 12, color: C.ink, textTransform: 'uppercase' },
});
