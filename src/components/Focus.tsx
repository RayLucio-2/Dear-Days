import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { useTimer } from '@/lib/timer';
import { moveTask, success, tomorrowOf } from '@/lib/actions';
import { key, today } from '@/lib/dates';
import { CATS, dayQueue, ENERGIA, QItem } from '@/lib/planner';
import { SubList, subCount } from './TaskItem';
import { TimerDisc } from './TimerDisc';
import { Btn, Row, T } from './ui';
import { C, F, R } from '@/lib/theme';

const itemKey = (x: QItem) => (x.kind === 'meta' ? 'm' + x.i : x.kind === 'task' ? 't' + x.i : 'r' + x.r.id);
const titleOf = (x: QItem) => (x.kind === 'meta' ? x.t : x.kind === 'task' ? String(x.task.t || '') : x.r.t);

/**
 * Modo foco: uma coisa por vez. Prioridades primeiro, depois as tarefas pelo horário.
 * "Pular" manda a tarefa para o fim da fila só nesta sessão, sem culpa.
 * Com energia baixa no dia, as tarefas leves vêm primeiro e as pesadas ficam guardadas.
 */
export function Focus({ d, strong, soft, onExit }: { d: Date; strong: string; soft: string; onExit: () => void }) {
  const docs = useStore((s) => s.docs);
  const run = useTimer((t) => t.run);
  const { set, push } = useStore.getState();
  const day = key(d);
  const id = 'd-' + day;
  const doc = docs[id] || {};
  const [later, setLater] = useState<string[]>([]);
  const [quick, setQuick] = useState('');
  const [showHeavy, setShowHeavy] = useState(false);
  const low = doc.energia === 0;

  const all = dayQueue(docs, d).filter((x) => titleOf(x).trim());
  const done = all.filter((x) => x.ok).length;
  let pending = all.filter((x) => !x.ok);
  const heavy = low ? pending.filter((x) => x.kind === 'task' && x.task.en === 2) : [];
  if (low) {
    if (!showHeavy) pending = pending.filter((x) => !heavy.includes(x));
    const light = (x: QItem) => (x.kind === 'meta' ? -1 : x.kind === 'task' && x.task.en === 0 ? 0 : 1); // prioridades continuam primeiro
    pending = [...pending].sort((a, b) => light(a) - light(b)); // sort estável: mantém a ordem dentro de cada grupo
  }
  const queue = [...pending.filter((x) => !later.includes(itemKey(x))), ...later.map((k) => pending.find((x) => itemKey(x) === k)).filter(Boolean) as QItem[]];
  const cur = queue[0];
  const next = queue[1];
  const timerHere = !!run && cur && run.day === day && (cur.kind === 'task' ? run.i === cur.i : run.label === titleOf(cur));

  function finish(x: QItem) {
    if (timerHere) useTimer.getState().stop();
    if (x.kind === 'meta') set(id, `metas.${x.i}.ok`, true);
    else if (x.kind === 'task') set(id, `tl.${x.i}.ok`, true);
    else set(id, `rd.${x.r.id}`, true);
    success();
    setLater((l) => l.filter((k) => k !== itemKey(x)));
  }
  function skip(x: QItem) {
    const k = itemKey(x);
    setLater((l) => [...l.filter((z) => z !== k), k]);
  }
  function startTimer(x: QItem, min: number) {
    useTimer.getState().start({ label: titleOf(x), day, i: x.kind === 'task' ? x.i : null, dur: min * 60000 });
  }
  function addQuick() {
    const v = quick.trim();
    if (!v) return;
    push(id, 'tl', { time: '', end: '', t: v, desc: '', cat: 0, ok: false, sub: [] });
    setQuick('');
  }

  const pct = all.length ? done / all.length : 0;
  const est = cur?.kind === 'task' ? Number(cur.task.est || 0) : 0;

  return (
    <View>
      <View style={st.progress}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={st.progT}>{done} de {all.length} feitas</Text>
          <EnergyPicker id={id} value={doc.energia} color={strong} />
        </Row>
        <View style={st.track}><View style={[st.fill, { width: `${pct * 100}%`, backgroundColor: strong }]} /></View>
      </View>

      {low && heavy.length ? (
        <Pressable onPress={() => setShowHeavy(!showHeavy)} style={st.lowNote} accessibilityRole="button">
          <Ionicons name="battery-dead-outline" size={16} color={C.muted} />
          <Text style={st.lowT}>{showHeavy ? 'Mostrando todas as tarefas.' : `Energia baixa: guardei ${heavy.length} tarefa${heavy.length > 1 ? 's' : ''} pesada${heavy.length > 1 ? 's' : ''}. Toque para ver.`}</Text>
        </Pressable>
      ) : null}

      {!cur ? (
        <View style={[st.card, { alignItems: 'center', backgroundColor: soft, borderColor: soft }]}>
          <Text style={[st.big, { textAlign: 'center' }]}>{all.length ? 'Tudo feito por hoje' : 'Nada planejado ainda'}</Text>
          <T muted style={{ textAlign: 'center', marginBottom: 14 }}>
            {all.length ? 'Pode descansar. O que fizer a mais é bônus.' : 'Escreva abaixo a primeira coisa que quer fazer hoje.'}
          </T>
          <Btn kind="soft" title="Ver o dia completo" onPress={onExit} color={C.ink} />
        </View>
      ) : (
        <View style={st.card}>
          <View style={[st.bar, { backgroundColor: cur.kind === 'task' ? CATS[cur.task.cat || 0] : soft }]} />
          <Text style={[st.kind, { color: strong }]}>
            {cur.kind === 'meta' ? 'Prioridade do dia' : cur.kind === 'rule' ? 'Tarefa fixa' : 'Agora'}
            {cur.kind === 'task' && cur.task.time ? ` · ${cur.task.time}${cur.task.end ? '–' + cur.task.end : ''}` : ''}
            {cur.kind === 'rule' && cur.r.time ? ` · ${cur.r.time}${cur.r.end ? '–' + cur.r.end : ''}` : ''}
            {est ? ` · ~${est} min` : ''}
            {cur.kind === 'task' && cur.task.en != null ? ` · energia ${ENERGIA[cur.task.en]}` : ''}
          </Text>
          <Text style={st.big}>{titleOf(cur)}</Text>
          {cur.kind === 'task' && cur.task.desc ? <T muted style={{ marginBottom: 6 }}>{cur.task.desc}</T> : null}
          {cur.kind === 'rule' && cur.r.desc ? <T muted style={{ marginBottom: 6 }}>{cur.r.desc}</T> : null}

          {cur.kind === 'task' && cur.task.first ? (
            <View style={[st.first, { borderColor: strong }]}>
              <Text style={[st.firstL, { color: strong }]}>Primeiro passo</Text>
              <Text style={st.firstT}>{cur.task.first}</Text>
            </View>
          ) : null}

          {cur.kind === 'task' && subCount(cur.task).total ? (
            <View style={{ marginBottom: 6 }}>
              <T muted small style={{ marginBottom: 4 }}>{subCount(cur.task).done} de {subCount(cur.task).total} passos</T>
              <SubList id={id} i={cur.i} t={cur.task} color={strong} big />
            </View>
          ) : null}

          {timerHere ? (
            <TimerDisc color={strong} hint="Só começar já conta." />
          ) : run ? (
            <T muted small style={{ textAlign: 'center', marginTop: 6 }}>Cronômetro rodando para “{run.label}”.</T>
          ) : (
            <Row style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <Btn kind="soft" title="Só 5 minutos" icon="play-outline" onPress={() => startTimer(cur, 5)} color={strong} />
              {est && est !== 5 ? <Btn kind="soft" title={`Timer de ${est} min`} icon="hourglass-outline" onPress={() => startTimer(cur, est)} color={C.ink} /> : null}
            </Row>
          )}

          <View style={st.actions}>
            <Btn title="Feito" icon="checkmark" onPress={() => finish(cur)} color={strong} style={{ flex: 1, minHeight: 50 }} />
            <Btn kind="soft" title="Pular" icon="play-skip-forward-outline" onPress={() => skip(cur)} color={C.ink} style={{ minHeight: 50 }} />
          </View>
          <Row style={{ justifyContent: 'center', gap: 18, marginTop: 4 }}>
            {cur.kind === 'task' ? <Btn kind="link" title="Passar para amanhã" onPress={() => moveTask(day, cur.i, tomorrowOf(day))} color={C.muted} /> : null}
            {cur.kind === 'rule' ? <Btn kind="link" title="Não fazer hoje" onPress={() => set(id, `rs.${cur.r.id}`, true)} color={C.muted} /> : null}
          </Row>
        </View>
      )}

      {next ? (
        <Row style={st.next}>
          <Text style={st.nextL}>Em seguida</Text>
          <Text style={st.nextT} numberOfLines={1}>{titleOf(next)}</Text>
        </Row>
      ) : null}

      <View style={st.quick}>
        <Ionicons name="add-circle-outline" size={22} color={strong} />
        <TextInput value={quick} onChangeText={setQuick} onSubmitEditing={addQuick} blurOnSubmit={false} returnKeyType="done"
          placeholder="Lembrou de algo? Anote aqui" placeholderTextColor={C.placeholder} style={st.quickIn} accessibilityLabel="Anotar tarefa rápida" />
        {quick.trim() ? <Pressable onPress={addQuick} hitSlop={8} accessibilityLabel="Adicionar"><Ionicons name="arrow-up-circle" size={28} color={strong} /></Pressable> : null}
      </View>
      {day !== key(today()) ? <T muted small style={{ textAlign: 'center', marginTop: 8 }}>Você está vendo outro dia, não hoje.</T> : null}
    </View>
  );
}

/** Energia do dia: baixa, média ou alta (d-.energia = 0, 1 ou 2). */
export function EnergyPicker({ id, value, color }: { id: string; value?: number; color: string }) {
  const set = useStore((s) => s.set);
  const icons = ['battery-dead-outline', 'battery-half-outline', 'battery-full-outline'] as const;
  return (
    <Row style={{ gap: 4 }}>
      <Text style={st.enL}>energia</Text>
      {ENERGIA.map((n, j) => {
        const on = value === j;
        return (
          <Pressable key={n} onPress={() => set(id, 'energia', on ? undefined : j)} accessibilityRole="button" accessibilityLabel={`Energia ${n}`} accessibilityState={{ selected: on }}
            hitSlop={4} style={[st.en, on && { backgroundColor: color, borderColor: color }]}>
            <Ionicons name={icons[j]} size={15} color={on ? '#fff' : C.muted} />
          </Pressable>
        );
      })}
    </Row>
  );
}

const st = StyleSheet.create({
  progress: { marginBottom: 12 },
  progT: { fontFamily: F.bodyMed, fontSize: 13, color: C.muted },
  track: { height: 8, backgroundColor: C.sand, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  enL: { fontFamily: F.body, fontSize: 12, color: C.muted, marginRight: 2 },
  en: { width: 32, height: 28, borderRadius: 14, backgroundColor: C.glass, alignItems: 'center', justifyContent: 'center' },
  lowNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.sand, borderRadius: R.md, padding: 10, marginBottom: 12 },
  lowT: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.ink },
  card: { backgroundColor: C.surface, borderRadius: 28, padding: 26, paddingTop: 22, marginBottom: 14 },
  bar: { width: 44, height: 5, borderRadius: 3, marginBottom: 14 },
  kind: { fontFamily: F.bodySemi, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  big: { fontFamily: F.title, fontSize: 34, lineHeight: 40, color: C.ink, marginBottom: 10 },
  first: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4, marginBottom: 10 },
  firstL: { fontFamily: F.bodySemi, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  firstT: { fontFamily: F.bodyMed, fontSize: 17, color: C.ink, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  next: { backgroundColor: C.sand, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  nextL: { fontFamily: F.bodyMed, fontSize: 12, color: C.muted },
  nextT: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.ink },
  quick: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.glass, borderWidth: 0, borderRadius: 999, paddingLeft: 14, paddingRight: 8, minHeight: 50 },
  quickIn: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink, minHeight: 46 },
});
