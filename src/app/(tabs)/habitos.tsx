import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '@/lib/store';
import { fromKey, key, mkey, today } from '@/lib/dates';
import { HAB_CORES, habits, streakInfo, uid } from '@/lib/planner';
import { Btn, Card, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { MonthNav } from '@/components/MonthNav';
import { C, F, R } from '@/lib/theme';

/** Cor do hábito: campo novo "cor"; os antigos usavam "cat" (azul, rosa, verde, areia). */
const corDe = (h: any) => HAB_CORES[(typeof h.cor === 'number' ? h.cor : [1, 0, 5, 4][h.cat || 0]) % HAB_CORES.length].c;

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

  function add() {
    const nome = novo.trim();
    if (!nome) return;
    push('t-habs', 'hl', { id: uid('h'), n: nome, cor: hs.length % HAB_CORES.length });
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
        const [fundo, vazia, cheia] = corDe(h);
        let k = 0;
        for (let i = 1; i <= n; i++) if (docs[mid]?.hk?.[h.id]?.[i]) k++;
        const pc = Math.round((k / (passed || n)) * 100);
        const { n: sk, folgas } = streakInfo(docs, h.id);
        const hi = idx(h.id);
        return (
          <View key={h.id} style={[st.card, { backgroundColor: fundo }]}>
            <Row style={{ marginBottom: 12, gap: 10 }}>
              {edit ? (
                <TextInput style={[ui.input, st.name, { flex: 1 }]} defaultValue={h.n} onChangeText={(v) => set('t-habs', `hl.${hi}.n`, v)} accessibilityLabel="Nome do hábito" />
              ) : (
                <Text style={[st.name, { flex: 1 }]}>{h.n || 'Sem nome'}</Text>
              )}
              {edit ? (
                <IconBtn icon="trash-outline" label="Apagar hábito" color={C.danger} onPress={() => useStore.getState().remove('t-habs', 'hl', hi)} />
              ) : (
                <View style={[st.pill, { backgroundColor: vazia }]}><Text style={[st.pillT, { color: cheia }]}>{pc}%</Text></View>
              )}
            </Row>
            {edit ? (
              <Row style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {HAB_CORES.map((c, j) => (
                  <Pressable key={c.n} onPress={() => set('t-habs', `hl.${hi}.cor`, j)} accessibilityLabel={`Cor ${c.n}`}
                    style={[st.cat, { backgroundColor: c.c[2] }, corDe(h)[2] === c.c[2] && { borderColor: C.ink }]} />
                ))}
              </Row>
            ) : null}
            <View style={st.dots}>
              {Array.from({ length: n }, (_, i) => {
                const dd = new Date(y, m, i + 1);
                const on = !!docs[mid]?.hk?.[h.id]?.[i + 1];
                const isT = key(dd) === key(t);
                const futuro = dd > t && !isT;
                return (
                  <Pressable key={i} disabled={futuro} onPress={() => set(mid, `hk.${h.id}.${i + 1}`, !on)} hitSlop={4}
                    accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: futuro }} accessibilityLabel={`${h.n}, dia ${i + 1}`}
                    style={[st.bol, { backgroundColor: on ? cheia : vazia, opacity: futuro ? 0.45 : 1 }, isT && { borderWidth: 2, borderColor: C.ink }]} />
                );
              })}
            </View>
            {!edit ? (
              <Text style={st.meta}>
                {k} de {passed || n} dias{sk ? ` · ${sk} dia${sk > 1 ? 's' : ''} seguido${sk > 1 ? 's' : ''}${folgas ? ` (${folgas} folga${folgas > 1 ? 's' : ''})` : ''}` : ''}
              </Text>
            ) : null}
          </View>
        );
      })}

      {hs.length ? <T muted small style={{ marginBottom: 12, textAlign: 'center' }}>Perdeu um dia? Tudo bem: 1 folga por semana não zera a sequência.</T> : null}

      <Card title="Novo hábito">
        <Row>
          <TextInput style={ui.input} value={novo} onChangeText={setNovo} placeholder="ex.: ler 10 páginas" placeholderTextColor={C.placeholder} onSubmitEditing={add} returnKeyType="done" />
          <Btn title="Adicionar" onPress={add} />
        </Row>
        {hs.length ? <Btn kind="link" color={C.accent} title={edit ? 'Pronto' : 'Editar nomes e cores'} onPress={() => setEdit(!edit)} style={{ marginTop: 8, alignSelf: 'flex-start' }} /> : null}
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: R.lg, padding: 18, marginBottom: 12 },
  name: { fontFamily: F.bodyMed, fontSize: 17, color: C.ink },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillT: { fontFamily: F.bodySemi, fontSize: 13 },
  meta: { fontFamily: F.body, fontSize: 12, color: C.muted, marginTop: 12 },
  cat: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bol: { width: 22, height: 22, borderRadius: 11 },
});
