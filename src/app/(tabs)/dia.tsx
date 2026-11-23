import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDoc, useStore } from '@/lib/store';
import { addDays, DIASL, fromKey, holiday, key, MESES, minutes, pad, today } from '@/lib/dates';
import { brl, num } from '@/lib/money';
import { CATS, CATSTRONG, dayInfo, dayQueue, EXER, FOOD, habits, MOODN, monthColor, Rule, rulesFor, Task, uid } from '@/lib/planner';
import { Btn, DocCheck, Field, Fold, IconBtn, Row, Screen, Section, T, Total, s as ui } from '@/components/ui';
import { DayNav } from '@/components/DayNav';
import { EnergyPicker, Focus } from '@/components/Focus';
import { Routine } from '@/components/Routine';
import { moveAll, pendingIdx } from '@/lib/actions';
import { CalEvent, downloadIcs } from '@/lib/gcal';
import { AgendaDia } from '@/components/AgendaDia';
import Svg, { Circle } from 'react-native-svg';
import { TaskItem } from '@/components/TaskItem';
import { Cup, Face } from '@/components/art';
import { C, F, R } from '@/lib/theme';

export default function Dia() {
  const cur = useStore((s) => s.cur);
  const setCur = useStore((s) => s.setCur);
  const docs = useStore((s) => s.docs);
  const set = useStore((s) => s.set);
  const d = fromKey(cur);
  const id = 'd-' + cur;
  const doc = useDoc(id);
  const [soft, strong] = monthColor(d);
  const fer = holiday(d);
  const isToday = cur === key(today());
  const foco = !!docs['t-cfg']?.app?.foco;
  const info = dayInfo(docs, d);

  const water = Number(doc.water || 0);
  const spendTotal = Object.values(doc.spend || {}).reduce((t: number, x: any) => t + num(x?.v), 0);
  const metasN = [0, 1, 2].filter((i) => String(doc.metas?.[i]?.t || '').trim());
  const metasOk = metasN.filter((i) => doc.metas?.[i]?.ok).length;
  const foodN = FOOD.filter(([k]) => String(doc.food?.[k] || '').trim()).length;

  return (
    <Screen>
      <View style={st.head}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.eyebrow, { color: strong }]}>{DIASL[d.getDay()]}{fer ? ` · ${fer}` : ''}</Text>
          <Text style={ui.h1}>
            {pad(d.getDate())} <Text style={st.headSub}>de {MESES[d.getMonth()].toLowerCase()}</Text>
          </Text>
        </View>
        <IconBtn icon="chevron-back" label="Dia anterior" onPress={() => setCur(key(addDays(d, -1)))} />
        {!isToday ? <Btn kind="soft" title="Hoje" onPress={() => setCur(key(today()))} style={{ minHeight: 34, paddingHorizontal: 12 }} /> : null}
        <IconBtn icon="chevron-forward" label="Próximo dia" onPress={() => setCur(key(addDays(d, 1)))} />
      </View>
      <DayNav />

      <View style={st.seg} accessibilityRole="tablist">
        {[['Dia completo', false, 'list-outline'], ['Modo foco', true, 'locate-outline']].map(([label, v, icon]) => {
          const on = foco === v;
          return (
            <Pressable key={String(label)} onPress={() => set('t-cfg', 'app.foco', v)} accessibilityRole="tab" accessibilityState={{ selected: on }}
              style={[st.segB, on && { backgroundColor: C.surface }]}>
              <Ionicons name={icon as any} size={16} color={on ? strong : C.muted} />
              <Text style={[st.segT, on && { color: C.ink }]}>{String(label)}</Text>
            </Pressable>
          );
        })}
      </View>

      {foco ? (
        <Focus d={d} strong={strong} soft={soft} onExit={() => set('t-cfg', 'app.foco', false)} />
      ) : (
        <>
          <View style={[st.summary, { backgroundColor: soft }]}>
            <Ring pct={info.total ? info.done / info.total : 0} color={strong} />
            <View style={{ flex: 1 }}>
              <Text style={st.sumN}>{info.done}<Text style={st.sumOf}>/{info.total}</Text></Text>
              <Text style={st.sumL}>{!info.total ? 'nada planejado ainda' : info.done === info.total ? 'tudo feito, que bom' : info.done ? 'feitas hoje' : 'tudo bem, comece por uma'}</Text>
              <View style={{ marginTop: 6 }}><EnergyPicker id={id} value={doc.energia} color={strong} /></View>
            </View>
            <View style={st.sumSide}>
              <Text style={st.sumMini}><Ionicons name="water-outline" size={13} /> {water}/8</Text>
              {info.mood ? <Text style={st.sumMini}>{MOODN[info.mood - 1]}</Text> : null}
            </View>
          </View>
          {isToday ? <Yesterday today={cur} color={strong} /> : null}

          <Section title="Agora" color={strong} />
          <Fold id="dia-prio" title="Prioridades" icon="star-outline" color={strong} summary={metasN.length ? `${metasOk} de ${metasN.length} feitas` : 'até 3 coisas importantes'}>
            {[0, 1, 2].map((i) => (
              <Row key={i} style={st.line}>
                <Text style={[st.n, { color: strong }]}>{i + 1}</Text>
                <Field doc={id} path={`metas.${i}.t`} placeholder={i === 0 ? 'O mais importante de hoje' : ''} style={[st.noLine, doc.metas?.[i]?.ok && st.done]} />
                <DocCheck doc={id} path={`metas.${i}.ok`} color={strong} label="Prioridade feita" />
              </Row>
            ))}
          </Fold>
          <Routine kind="manha" dayId={id} color={strong} />
          <Tasks id={id} d={d} strong={strong} />
          <HabitsToday d={d} />
          <Routine kind="noite" dayId={id} color={strong} />

          <Section title="Cuidar de mim" color={strong} />
          <Fold id="dia-humor" title="Humor" icon="happy-outline" color={strong} summary={info.mood ? MOODN[info.mood - 1] : 'como você está?'}>
            <View style={st.moods}>
              {MOODN.map((n, i) => {
                const on = doc.mood === i + 1;
                return (
                  <Pressable key={n} onPress={() => set(id, 'mood', on ? 0 : i + 1)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={n}
                    style={[st.mood, on && { backgroundColor: C.sand, borderColor: strong }]}>
                    <Face i={i} size={34} />
                    <Text style={st.moodT}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Fold>
          <Fold id="dia-agua" title="Água" icon="water-outline" color={CATSTRONG[0]} summary={`${water} de 8 copos`} right={<T muted small>{water}/8</T>}>
            <View style={st.cups}>
              {Array.from({ length: 8 }, (_, i) => (
                <Pressable key={i} onPress={() => set(id, 'water', water === i + 1 ? i : i + 1)} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${i + 1} copo${i ? 's' : ''} de água`}>
                  <Cup full={water > i} color={strong} size={32} />
                </Pressable>
              ))}
            </View>
          </Fold>
          <Fold id="dia-sono" title="Sono" icon="moon-outline" color={CATSTRONG[0]} summary={doc.wake || doc.sleep ? `acordei ${doc.wake || '--'} · dormi ${doc.sleep || '--'}` : 'que horas acordou e dormiu'}>
            <Row>
              <View style={{ flex: 1 }}><T muted small>acordei</T><Field doc={id} path="wake" time /></View>
              <View style={{ flex: 1 }}><T muted small>dormi</T><Field doc={id} path="sleep" time /></View>
            </Row>
          </Fold>
          <Fold id="dia-ex" title="Exercício" icon="walk-outline" color={CATSTRONG[2]} summary={doc.ex || 'não marcado'}>
            <View style={st.opts}>
              {EXER.map((e) => {
                const on = doc.ex === e;
                return (
                  <Pressable key={e} onPress={() => set(id, 'ex', on ? '' : e)} style={[st.opt, on && { backgroundColor: strong, borderColor: strong }]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                    <Text style={[st.optT, on && { color: '#fff' }]}>{e}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Fold>
          <Fold id="dia-food" title="Alimentação" icon="restaurant-outline" color={CATSTRONG[3]} summary={`${foodN} de 4 refeições anotadas`} startClosed>
            {FOOD.map(([k, l]) => (
              <Row key={k}><Text style={st.lbl}>{l}</Text><Field doc={id} path={`food.${k}`} /></Row>
            ))}
          </Fold>

          <Section title="Registro do dia" color={strong} />
          <Hours id={id} d={d} />
          <Fold id="dia-gastos" title="Gastos do dia" icon="wallet-outline" color={CATSTRONG[3]} summary={spendTotal ? brl(spendTotal) : 'nenhum gasto anotado'} startClosed>
            {[0, 1, 2, 3, 4].map((i) => (
              <Row key={i}>
                <Field doc={id} path={`spend.${i}.t`} placeholder={i === 0 ? 'O que comprei' : ''} />
                <Field doc={id} path={`spend.${i}.v`} placeholder="R$" keyboardType="decimal-pad" style={st.money} />
              </Row>
            ))}
            <Total label="Total" value={brl(spendTotal)} strong />
          </Fold>
          <Fold id="dia-bom" title="Uma coisa boa de hoje" icon="sparkles-outline" color={CATSTRONG[1]} summary={doc.good ? String(doc.good) : 'algo que deu certo'}>
            <Field doc={id} path="good" multiline placeholder="Algo que deu certo, alguém que fez bem, um momento bom" />
          </Fold>
          <CardPicker color={strong} />
        </>
      )}
    </Screen>
  );
}

/** Anel de progresso do dia. */
function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 24, c = 2 * Math.PI * r;
  return (
    <Svg width={60} height={60} style={{ marginRight: 14 }}>
      <Circle cx={30} cy={30} r={r} stroke="rgba(255,255,255,0.7)" strokeWidth={7} fill="none" />
      <Circle cx={30} cy={30} r={r} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round"
        strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 30 30)" />
    </Svg>
  );
}

/** Tarefas de ontem que ficaram: oferece trazer para hoje, sem bronca. */
function Yesterday({ today: tk, color }: { today: string; color: string }) {
  const y = key(addDays(fromKey(tk), -1));
  useStore((s) => s.docs['d-' + y]); // re-renderiza quando ontem muda
  const dismissed = useStore((s) => s.docs['d-' + tk]?.ontemOk);
  const set = useStore((s) => s.set);
  const idx = pendingIdx(y);
  if (!idx.length || dismissed) return null;
  return (
    <View style={st.yest}>
      <Ionicons name="sunny-outline" size={18} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={st.yestT}>{idx.length > 1 ? `Ontem ficaram ${idx.length} tarefas.` : 'Ontem ficou 1 tarefa.'} Tudo bem, recomeça agora.</Text>
        <Row style={{ gap: 14, marginTop: 4 }}>
          <Btn kind="link" title="Trazer para hoje" color={color} onPress={() => moveAll(y, idx, tk)} />
          <Btn kind="link" title="Deixar lá" color={C.muted} onPress={() => set('d-' + tk, 'ontemOk', true)} />
        </Row>
      </View>
    </View>
  );
}

/** Escolher quais cartões aparecem no Dia. */
const CARDS: [string, string][] = [
  ['dia-prio', 'Prioridades'], ['dia-rot-manha', 'Rotina da manhã'], ['dia-tarefas', 'Tarefas'], ['dia-habitos', 'Hábitos de hoje'],
  ['dia-rot-noite', 'Rotina da noite'], ['dia-humor', 'Humor'], ['dia-agua', 'Água'], ['dia-sono', 'Sono'], ['dia-ex', 'Exercício'],
  ['dia-food', 'Alimentação'], ['dia-horas', 'Horários'], ['dia-gastos', 'Gastos do dia'], ['dia-bom', 'Uma coisa boa'],
];
function CardPicker({ color }: { color: string }) {
  const oc = useStore((s) => s.docs['t-cfg']?.app?.ocultos) || {};
  const set = useStore((s) => s.set);
  const [open, setOpen] = useState(false);
  const n = CARDS.filter(([k]) => oc[k]).length;
  return (
    <View style={{ marginTop: 6 }}>
      <Btn kind="soft" icon="options-outline" title={open ? 'Pronto' : `Escolher o que aparece${n ? ` (${n} escondido${n > 1 ? 's' : ''})` : ''}`} color={C.ink}
        onPress={() => setOpen(!open)} style={{ alignSelf: 'center' }} />
      {open ? (
        <View style={st.pick}>
          <T muted small style={{ width: '100%', marginBottom: 4 }}>Toque para mostrar ou esconder. Vale para todos os dias.</T>
          {CARDS.map(([k, l]) => {
            const on = !oc[k];
            return (
              <Pressable key={k} onPress={() => set('t-cfg', `app.ocultos.${k}`, on ? true : undefined)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                style={[st.pickB, on && { backgroundColor: color, borderColor: color }]}>
                <Ionicons name={on ? 'eye-outline' : 'eye-off-outline'} size={14} color={on ? '#fff' : C.muted} />
                <Text style={[st.pickT, on && { color: '#fff' }]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function HabitsToday({ d }: { d: Date }) {
  const docs = useStore((s) => s.docs);
  const set = useStore((s) => s.set);
  const hs = habits(docs);
  const mid = 'm-' + key(d).slice(0, 7);
  const on = (hid: string) => !!docs[mid]?.hk?.[hid]?.[d.getDate()];
  const doneN = hs.filter((h) => on(h.id)).length;
  return (
    <Fold id="dia-habitos" title="Hábitos de hoje" icon="leaf-outline" color={CATSTRONG[2]} summary={hs.length ? `${doneN} de ${hs.length} feitos` : 'nenhum hábito criado'}>
      {!hs.length ? (
        <>
          <T muted style={{ marginBottom: 10 }}>Crie os hábitos que quer acompanhar todo dia.</T>
          <Btn kind="soft" title="Criar hábitos" onPress={() => router.navigate('/habitos')} style={{ alignSelf: 'flex-start' }} />
        </>
      ) : (
        <View style={st.pills}>
          {hs.map((h) => {
            const v = on(h.id);
            const col = CATSTRONG[h.cat || 0];
            return (
              <Pressable key={h.id} onPress={() => set(mid, `hk.${h.id}.${d.getDate()}`, !v)} accessibilityRole="checkbox" accessibilityState={{ checked: v }}
                style={[st.pill, { borderColor: col }, v && { backgroundColor: col }]}>
                <Ionicons name={v ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={v ? '#fff' : col} />
                <Text style={[st.pillT, v && { color: '#fff' }]}>{h.n || 'Sem nome'}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Fold>
  );
}

function Tasks({ id, d, strong }: { id: string; d: Date; strong: string }) {
  const doc = useDoc(id);
  const docs = useStore((s) => s.docs);
  const { set, push, remove } = useStore.getState();
  const [fresh, setFresh] = useState<number | null>(null);
  const tl: Task[] = Array.isArray(doc.tl) ? doc.tl : [];
  const skipped = rulesFor(docs, d).filter((r) => doc.rs?.[r.id]).length;
  const items = dayQueue(docs, d).filter((x) => x.kind !== 'meta');
  const visible = items;
  const doneN = items.filter((x) => x.ok && (x.kind !== 'task' || String(x.task.t || '').trim())).length;
  const totalN = items.filter((x) => x.kind !== 'task' || String(x.task.t || '').trim()).length;

  function makeRule(i: number) {
    const t = tl[i];
    if (!t?.t) return;
    const r: Rule = { id: uid('r'), t: t.t, time: t.time || '', end: t.end || '', desc: t.desc || '', cat: t.cat || 0, days: [0, 1, 2, 3, 4, 5, 6], from: key(d) };
    push('t-rot', 'r', r);
    if (t.ok) set(id, `rd.${r.id}`, true);
    remove(id, 'tl', i);
  }
  /** Baixa um .ics com as tarefas do dia (abre no Google Agenda, Agenda do iPhone ou Outlook). */
  function exportDay() {
    const day = id.slice(2);
    const evs: CalEvent[] = [];
    items.forEach((x) => {
      if (x.kind === 'task' && String(x.task.t || '').trim()) evs.push({ title: String(x.task.t), day, start: x.task.time, end: x.task.end, details: x.task.desc });
      else if (x.kind === 'rule' && x.r.t) evs.push({ title: x.r.t, day, start: x.r.time, end: x.r.end, details: x.r.desc });
    });
    if (evs.length) downloadIcs(evs, `dear-days-${day}.ics`);
  }
  function add() {
    setFresh(tl.length);
    push(id, 'tl', { time: '', end: '', t: '', desc: '', cat: 0, ok: false, sub: [] });
  }

  return (
    <Fold id="dia-tarefas" title="Tarefas" icon="checkbox-outline" color={strong} summary={totalN ? `${doneN} de ${totalN} feitas` : 'nenhuma tarefa'}>
      <AgendaDia id={id} strong={strong} />
      {!visible.length ? <T muted style={{ marginBottom: 10 }}>Nenhuma tarefa ainda. Toque em adicionar e, se for grande, quebre em subtarefas.</T> : null}
      {visible.map((x) =>
        x.kind === 'task' ? (
          <TaskItem key={'t' + x.i} id={id} i={x.i} t={x.task} strong={strong} onRepeat={() => makeRule(x.i)} startOpen={x.i === fresh} />
        ) : x.kind === 'rule' ? (
          <View key={'r' + x.r.id} style={[st.rule, { borderLeftColor: CATSTRONG[x.r.cat || 0] }]}>
            <Row>
              <DocCheck doc={id} path={`rd.${x.r.id}`} color={strong} label="Tarefa fixa feita" />
              <View style={{ flex: 1, paddingVertical: 6 }}>
                <Text style={[ui.t, { fontFamily: F.bodyMed }, x.ok && st.done]}>{x.r.t}</Text>
                <Row style={{ gap: 6, marginTop: 2 }}>
                  {x.r.time ? <View style={[st.chip, { backgroundColor: CATS[x.r.cat || 0] }]}><Text style={st.chipT}>{x.r.time}{x.r.end ? '–' + x.r.end : ''}</Text></View> : null}
                  <Ionicons name="repeat" size={13} color={C.muted} />
                  <T muted small>fixa</T>
                </Row>
              </View>
              <IconBtn icon="close" label="Não fazer hoje" onPress={() => set(id, `rs.${x.r.id}`, true)} size={18} />
            </Row>
          </View>
        ) : null,
      )}
      <Row style={{ justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap', rowGap: 4 }}>
        <Btn title="Adicionar tarefa" icon="add" color={strong} onPress={add} />
        <Row style={{ gap: 14 }}>
          <Btn kind="link" title="Agenda" icon="calendar-outline" color={C.accent} onPress={exportDay} />
          <Btn kind="link" title="Tarefas fixas" icon="repeat" color={C.accent} onPress={() => router.navigate('/rotina')} />
        </Row>
      </Row>
      {skipped ? (
        <Btn kind="link" color={C.accent} title={`Mostrar ${skipped} tarefa${skipped > 1 ? 's' : ''} fixa${skipped > 1 ? 's' : ''} pulada${skipped > 1 ? 's' : ''} hoje`} onPress={() => set(id, 'rs', {})} />
      ) : null}
    </Fold>
  );
}

function Hours({ id, d }: { id: string; d: Date }) {
  const doc = useDoc(id);
  const docs = useStore((s) => s.docs);
  const tasks = [
    ...(Array.isArray(doc.tl) ? doc.tl : []).filter((t: Task) => t && t.t && t.time).map((t: Task) => ({ ...t, rule: false })),
    ...rulesFor(docs, d).filter((r) => r.time && !doc.rs?.[r.id]).map((r) => ({ ...r, ok: !!doc.rd?.[r.id], rule: true })),
  ].map((t) => ({ ...t, s: minutes(t.time)!, e: minutes(t.end) }));

  const hrs = new Set<number>();
  for (let h = 6; h <= 22; h++) hrs.add(h);
  tasks.forEach((t) => {
    if (t.s == null) return;
    hrs.add(Math.floor(t.s / 60));
    if (t.e != null && t.e > t.s) for (let h = Math.floor(t.s / 60) + 1; h * 60 < t.e && h < 24; h++) hrs.add(h);
  });
  const now = new Date();
  const nowH = key(d) === key(today()) ? now.getHours() : -1;

  return (
    <Fold id="dia-horas" title="Horários" icon="time-outline" color={CATSTRONG[0]} summary={tasks.length ? `${tasks.length} com horário` : 'agenda do dia por hora'} startClosed>
      {[...hrs].sort((a, b) => a - b).map((h) => {
        const startHere = tasks.filter((t) => Math.floor(t.s / 60) === h);
        const cont = tasks.filter((t) => t.e != null && t.e > t.s && t.s < h * 60 && t.e > h * 60);
        const isNow = h === nowH;
        return (
          <View key={h} style={[st.hour, isNow && { backgroundColor: C.sand, borderRadius: 8 }]}>
            <Text style={[st.hourL, isNow && { color: C.ink, fontFamily: F.bodySemi }]}>{pad(h)}h</Text>
            {isNow ? <View pointerEvents="none" style={[st.nowLine, { top: `${(now.getMinutes() / 60) * 100}%` }]}><View style={st.nowDot} /></View> : null}
            <View style={{ flex: 1 }}>
              {isNow ? <Text style={st.nowT}>agora</Text> : null}
              {cont.map((t, i) => (
                <View key={'c' + i} style={[st.hchip, { backgroundColor: CATS[t.cat || 0], opacity: 0.7 }]}>
                  <Text style={[st.hchipT, t.ok && st.done]} numberOfLines={1}>{t.t}  <Text style={{ color: C.muted }}>até {t.end}</Text></Text>
                </View>
              ))}
              {startHere.map((t, i) => (
                <View key={'s' + i} style={[st.hchip, { backgroundColor: CATS[t.cat || 0] }]}>
                  <Text style={[st.hchipT, t.ok && st.done]} numberOfLines={1}>
                    <Text style={{ fontFamily: F.bodySemi }}>{t.time}{t.end && t.e! > t.s ? '–' + t.end : ''}</Text>  {t.t}{t.rule ? '  ⟳' : ''}
                  </Text>
                </View>
              ))}
              <Field doc={id} path={`h.${h}`} style={{ minHeight: 34, paddingVertical: 4, borderBottomWidth: 0 }} />
            </View>
          </View>
        );
      })}
    </Fold>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 10 },
  headSub: { fontFamily: F.titleItalic, fontSize: 22, color: C.muted },
  seg: { flexDirection: 'row', backgroundColor: C.sand, borderRadius: 999, padding: 4, marginBottom: 14 },
  segB: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', minHeight: 40, borderRadius: 999,
    shadowColor: '#5A4A3A', shadowOpacity: 0, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segT: { fontFamily: F.bodyMed, fontSize: 14, color: C.muted },
  yest: { flexDirection: 'row', gap: 10, backgroundColor: C.glass, borderRadius: R.lg, padding: 14, marginTop: 12 },
  yestT: { fontFamily: F.body, fontSize: 14, color: C.ink },
  pick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pickB: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, minHeight: 36 },
  pickT: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink },
  summary: { flexDirection: 'row', alignItems: 'center', borderRadius: R.lg, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 4 },
  sumN: { fontFamily: F.title, fontSize: 36, color: C.ink, lineHeight: 40 },
  sumOf: { fontSize: 22, color: C.muted },
  sumL: { fontFamily: F.body, fontSize: 13, color: C.ink },
  sumSide: { alignItems: 'flex-end', gap: 4 },
  sumMini: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink },
  moods: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  mood: { alignItems: 'center', width: '31%', paddingVertical: 8, borderRadius: R.md, borderWidth: 1, borderColor: 'transparent', gap: 4 },
  moodT: { fontFamily: F.body, fontSize: 12, color: C.muted },
  cups: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  line: { borderBottomWidth: 1, borderBottomColor: C.hair },
  n: { fontFamily: F.title, fontSize: 20, width: 16 },
  noLine: { borderBottomWidth: 0 },
  done: { textDecorationLine: 'line-through', color: C.muted },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, minHeight: 38, justifyContent: 'center' },
  optT: { fontFamily: F.bodyMed, fontSize: 14, color: C.ink },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, minHeight: 38 },
  pillT: { fontFamily: F.bodyMed, fontSize: 14, color: C.ink },
  rule: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: C.hair, paddingBottom: 4 },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  chipT: { fontFamily: F.bodyMed, fontSize: 12, color: C.ink },
  hour: { flexDirection: 'row', gap: 10, borderBottomWidth: 1, borderBottomColor: C.hair, paddingVertical: 2, paddingHorizontal: 4 },
  hourL: { fontFamily: F.bodyMed, fontSize: 13, color: C.muted, width: 34, paddingTop: 10 },
  nowLine: { position: 'absolute', left: 40, right: 0, height: 2, backgroundColor: C.accent, zIndex: 2 },
  nowDot: { position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
  nowT: { fontFamily: F.bodySemi, fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
  hchip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginTop: 4 },
  hchipT: { fontFamily: F.body, fontSize: 13, color: C.ink },
  money: { flex: 0, width: 110, textAlign: 'right' },
  lbl: { fontFamily: F.body, fontSize: 14, color: C.muted, width: 64 },
});
