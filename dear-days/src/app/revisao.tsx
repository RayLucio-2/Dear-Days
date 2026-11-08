import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { moveAll, success } from '@/lib/actions';
import { addDays, DIAS, key, pad, sunday, today } from '@/lib/dates';
import { dayInfo, habits, monthColor, Task } from '@/lib/planner';
import { Btn, Card, Field, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/**
 * Revisão da semana em 3 passos (uns 5 minutos):
 * 1. o que deu certo  2. o que passa para a próxima semana  3. três prioridades da próxima semana.
 * Guarda em w-<domingo>.rev.bom e em w-<próximo domingo>.prios (o mesmo campo do planner web).
 */
export default function Revisao() {
  const docs = useStore((s) => s.docs);
  const [step, setStep] = useState(0);
  const [pick, setPick] = useState<Record<string, boolean>>({});
  const [moved, setMoved] = useState(0);
  const t = today();
  const start = sunday(t);
  const nextSun = addDays(start, 7);
  const nextMon = addDays(start, 8);
  const wid = 'w-' + key(start), nwid = 'w-' + key(nextSun);
  const [, strong] = monthColor(t);

  // números da semana até hoje
  let feitas = 0, total = 0, hab = 0, humor = 0;
  const hs = habits(docs);
  const pend: { day: string; i: number; t: string; wd: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    if (d > t) break;
    const k = key(d);
    const inf = dayInfo(docs, d);
    feitas += inf.done; total += inf.total;
    if (inf.mood) humor++;
    hs.forEach((h) => { if (docs['m-' + k.slice(0, 7)]?.hk?.[h.id]?.[d.getDate()]) hab++; });
    (Array.isArray(docs['d-' + k]?.tl) ? docs['d-' + k].tl : []).forEach((x: Task, j: number) => {
      if (x && String(x.t || '').trim() && !x.ok) pend.push({ day: k, i: j, t: String(x.t), wd: d.getDay() });
    });
  }

  function levar() {
    const byDay: Record<string, number[]> = {};
    pend.forEach((p) => { if (pick[p.day + ':' + p.i]) (byDay[p.day] = byDay[p.day] || []).push(p.i); });
    let n = 0;
    Object.entries(byDay).forEach(([day, idx]) => { moveAll(day, idx, key(nextMon)); n += idx.length; });
    setMoved(n);
    setPick({});
    if (n) success();
    setStep(2);
  }

  const STEPS = ['O que deu certo', 'Levar para a próxima semana', 'Prioridades da próxima semana'];

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.eyebrow, { color: strong }]}>Revisão da semana · 5 minutos</Text>
          <Text style={ui.h1}>{pad(start.getDate())}/{pad(start.getMonth() + 1)} a {pad(addDays(start, 6).getDate())}/{pad(addDays(start, 6).getMonth() + 1)}</Text>
        </View>
        <IconBtn icon="close" label="Fechar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} size={26} color={C.ink} />
      </Row>

      <Row style={{ gap: 6, marginVertical: 14 }}>
        {STEPS.map((s, i) => (
          <Pressable key={s} onPress={() => setStep(i)} style={[st.dot, i <= step && { backgroundColor: strong }]} accessibilityRole="tab" accessibilityLabel={`Passo ${i + 1}: ${s}`} accessibilityState={{ selected: i === step }} />
        ))}
      </Row>

      <Card>
        <Text style={[st.n, { color: strong }]}>Passo {step + 1} de 3</Text>
        <Text style={st.h}>{STEPS[step]}</Text>

        {step === 0 ? (
          <>
            <View style={st.stats}>
              <Stat n={`${feitas}/${total}`} l="tarefas feitas" />
              <Stat n={String(hab)} l="hábitos marcados" />
              <Stat n={String(humor)} l="dias com humor" />
            </View>
            <T muted style={{ marginBottom: 8 }}>Não importa o tamanho. O que funcionou? O que te ajudou?</T>
            <Field doc={wid} path="rev.bom" multiline placeholder="Ex.: consegui fazer a rotina da manhã 3 dias" />
            <Btn title="Próximo" icon="arrow-forward" onPress={() => setStep(1)} color={strong} style={{ marginTop: 14 }} />
          </>
        ) : step === 1 ? (
          <>
            {!pend.length ? (
              <T muted style={{ marginBottom: 8 }}>Nenhuma tarefa ficou para trás esta semana.</T>
            ) : (
              <>
                <T muted style={{ marginBottom: 8 }}>Escolha só o que ainda importa. O resto pode ficar onde está, sem problema.</T>
                {pend.map((p) => {
                  const k = p.day + ':' + p.i;
                  const on = !!pick[k];
                  return (
                    <Pressable key={k} onPress={() => setPick({ ...pick, [k]: !on })} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={st.pend}>
                      <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? strong : C.muted} />
                      <Text style={[ui.t, { flex: 1 }]}>{p.t}</Text>
                      <T muted small>{DIAS[p.wd]}</T>
                    </Pressable>
                  );
                })}
              </>
            )}
            <Row style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <Btn title={Object.values(pick).some(Boolean) ? `Levar para segunda (${pad(nextMon.getDate())}/${pad(nextMon.getMonth() + 1)})` : 'Próximo'} icon="arrow-forward" onPress={levar} color={strong} />
              <Btn kind="link" title="Voltar" onPress={() => setStep(0)} color={C.muted} />
            </Row>
          </>
        ) : (
          <>
            {moved ? <T style={{ color: C.ok, marginBottom: 8 }}>{moved} tarefa{moved > 1 ? 's foram' : ' foi'} para segunda-feira.</T> : null}
            <T muted style={{ marginBottom: 8 }}>Três, no máximo. O que faria a próxima semana valer a pena?</T>
            {[0, 1, 2].map((i) => (
              <Row key={i}>
                <Text style={[st.big, { color: strong }]}>{i + 1}</Text>
                <Field doc={nwid} path={`prios.${i}`} placeholder={i === 0 ? 'O mais importante' : ''} />
              </Row>
            ))}
            <Row style={{ gap: 8, marginTop: 14 }}>
              <Btn title="Concluir revisão" icon="checkmark" color={strong} onPress={() => {
                useStore.getState().set(wid, 'rev.feita', new Date().toISOString());
                success();
                if (router.canGoBack()) router.back();
                else router.replace('/');
              }} />
              <Btn kind="link" title="Voltar" onPress={() => setStep(1)} color={C.muted} />
            </Row>
          </>
        )}
      </Card>
    </Screen>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View style={st.stat}>
      <Text style={st.statN}>{n}</Text>
      <Text style={st.statL}>{l}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.line },
  n: { fontFamily: F.bodySemi, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  h: { fontFamily: F.title, fontSize: 28, color: C.ink, marginBottom: 12 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: C.sand, borderRadius: R.md, padding: 12 },
  statN: { fontFamily: F.title, fontSize: 26, color: C.ink },
  statL: { fontFamily: F.body, fontSize: 12, color: C.muted },
  pend: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, borderBottomWidth: 1, borderBottomColor: C.hair },
  big: { fontFamily: F.title, fontSize: 22, width: 18 },
});
