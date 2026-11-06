import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '@/lib/store';
import { DIAS, fromKey, key, mkey, today } from '@/lib/dates';
import { CATN, CATS, CATSTRONG, habits, streakInfo, uid } from '@/lib/planner';
import { Btn, Card, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { MonthNav } from '@/components/MonthNav';
import { C, F } from '@/lib/theme';

export default function Habitos() {
  const cur = useStore((s) => s.cur);
  const docs = useStore((s) => s.docs);
  const { set, push } = useStore.getState();
  const d = fromKey(cur);
  const y = d.getFullYear(), m = d.getMonth();
  const n = new Date(y, m + 1, 0).getDate();
  const t = today();
  const mid = 'm-' + mkey(d);
  const hs = habits(docs);
  const passed = y < t.getFullYear() || (y === t.getFullYear() && m < t.getMonth()) ? n : y === t.getFullYear() && m === t.getMonth() ? t.getDate() : 0;
  const [novo, setNovo] = useState('');
  const [edit, setEdit] = useState(false);
  const scrolled = useRef(new Set<string>()); // rola até hoje só na primeira vez

  function add() {
    const nome = novo.trim();
    if (!nome) return;
    push('t-habs', 'hl', { id: uid('h'), n: nome, cat: hs.length % 4 });
    setNovo('');
  }
  const idx = (hid: string) => (docs['t-habs']?.hl || []).findIndex((x: any) => x?.id === hid);

  return (
    <Screen>
      <MonthNav eyebrow="Hábitos" />

      {!hs.length ? (
        <Card>
          <T muted>Escolha poucos hábitos para começar. Dois ou três já fazem diferença.</T>
        </Card>
      ) : null}

      {hs.map((h) => {
        const col = CATSTRONG[h.cat || 0];
        let k = 0;
        for (let i = 1; i <= n; i++) if (docs[mid]?.hk?.[h.id]?.[i]) k++;
        const pc = Math.round((k / (passed || n)) * 100);
        const { n: sk, folgas } = streakInfo(docs, h.id);
        const hi = idx(h.id);
        return (
          <Card key={h.id}>
            <Row style={{ marginBottom: 8 }}>
              <View style={[st.dot, { backgroundColor: CATS[h.cat || 0] }]} />
              {edit ? (
                <TextInput style={[ui.input, st.name]} defaultValue={h.n} onChangeText={(v) => set('t-habs', `hl.${hi}.n`, v)} accessibilityLabel="Nome do hábito" />
              ) : (
                <Text style={[st.name, { flex: 1 }]}>{h.n || 'Sem nome'}</Text>
              )}
              {edit ? (
                <>
                  {CATS.map((c, j) => (
                    <Pressable key={c} onPress={() => set('t-habs', `hl.${hi}.cat`, j)} accessibilityLabel={`Cor ${CATN[j]}`} style={[st.cat, { backgroundColor: c }, (h.cat || 0) === j && { borderColor: C.ink }]} />
                  ))}
                  <IconBtn icon="trash-outline" label="Apagar hábito" color={C.danger} onPress={() => useStore.getState().remove('t-habs', 'hl', hi)} />
                </>
              ) : (
                <Text style={st.meta}>{k}/{passed || n} · {pc}%{sk ? ` · ${sk} dia${sk > 1 ? 's' : ''} seguido${sk > 1 ? 's' : ''}${folgas ? ` (${folgas} folga${folgas > 1 ? 's' : ''})` : ''}` : ''}</Text>
              )}
            </Row>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              ref={(r) => { const sk = h.id + mid; if (!r || passed <= 7 || scrolled.current.has(sk)) return; scrolled.current.add(sk); setTimeout(() => r.scrollTo({ x: (passed - 6) * 34, animated: false }), 0); }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: n }, (_, i) => {
                  const dd = new Date(y, m, i + 1);
                  const on = !!docs[mid]?.hk?.[h.id]?.[i + 1];
                  const isT = key(dd) === key(t);
                  return (
                    <Pressable key={i} onPress={() => set(mid, `hk.${h.id}.${i + 1}`, !on)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${h.n}, dia ${i + 1}`}
                      style={st.cell}>
                      <Text style={[st.wd, dd.getDay() === 0 && { color: C.danger }]}>{DIAS[dd.getDay()][0]}</Text>
                      <View style={[st.box, { borderColor: isT ? C.ink : col }, on && { backgroundColor: col }]}>
                        <Text style={[st.num, on && { color: '#fff' }]}>{i + 1}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Card>
        );
      })}

      {hs.length ? <T muted small style={{ marginBottom: 12, textAlign: 'center' }}>Perdeu um dia? Tudo bem: 1 folga por semana não zera a sequência.</T> : null}

      <Card title="Novo hábito">
        <Row>
          <TextInput style={ui.input} value={novo} onChangeText={setNovo} placeholder="ex.: ler 10 páginas" placeholderTextColor="#A39A90" onSubmitEditing={add} returnKeyType="done" />
          <Btn title="Adicionar" onPress={add} />
        </Row>
        {hs.length ? <Btn kind="link" color={C.accent} title={edit ? 'Pronto' : 'Editar nomes e cores'} onPress={() => setEdit(!edit)} style={{ marginTop: 8, alignSelf: 'flex-start' }} /> : null}
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontFamily: F.bodyMed, fontSize: 16, color: C.ink },
  meta: { fontFamily: F.body, fontSize: 12, color: C.muted },
  cat: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'transparent' },
  cell: { alignItems: 'center', gap: 2 },
  wd: { fontFamily: F.body, fontSize: 10, color: C.muted },
  box: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: F.bodyMed, fontSize: 12, color: C.ink },
});
