import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { addDays, fromKey, key } from '@/lib/dates';
import { EXER } from '@/lib/planner';
import { IconBtn, Row, T } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/** Tipos de exercício com ícone. "ex" (intensidade) continua existindo; "exl" guarda a lista do dia. */
export const TIPOS: [string, string][] = [
  ['Caminhada', 'walk-outline'], ['Corrida', 'speedometer-outline'], ['Musculação', 'barbell-outline'], ['Pilates', 'body-outline'],
  ['Yoga', 'flower-outline'], ['Bicicleta', 'bicycle-outline'], ['Dança', 'musical-notes-outline'], ['Natação', 'water-outline'],
  ['Alongamento', 'accessibility-outline'], ['Outro', 'ellipsis-horizontal-circle-outline'],
];
const TEMPOS = [10, 15, 20, 30, 45, 60];
export type Atividade = { tipo: string; min: number };

export const atividadesDe = (doc: any): Atividade[] => (Array.isArray(doc?.exl) ? doc.exl.filter((x: any) => x && x.tipo) : []);
export const resumoEx = (doc: any) => {
  const l = atividadesDe(doc);
  if (l.length) return l.map((a) => `${a.tipo}${a.min ? ` ${a.min} min` : ''}`).join(' · ');
  return doc?.ex && doc.ex !== 'nenhum' ? doc.ex : 'não marcado';
};
/** Minutos de exercício nos 7 dias até a data (inclui o dia). */
export function minutosSemana(docs: any, dia: string) {
  const d = fromKey(dia);
  let t = 0;
  for (let i = 0; i < 7; i++) atividadesDe(docs['d-' + key(addDays(d, -i))]).forEach((a) => { t += Number(a.min) || 0; });
  return t;
}

export function Exercicio({ id, strong }: { id: string; strong: string }) {
  const doc = useStore((s) => s.docs[id]);
  const docs = useStore((s) => s.docs);
  const { set, push, remove } = useStore.getState();
  const l = atividadesDe(doc);
  const [tipo, setTipo] = useState('');
  const [min, setMin] = useState<number | null>(null);
  const [outro, setOutro] = useState('');
  const [livre, setLivre] = useState('');
  const semana = minutosSemana(docs, id.slice(2));

  function add() {
    const nome = tipo === 'Outro' ? outro.trim() || 'Outro' : tipo;
    const m = min ?? (parseInt(livre, 10) || 0);
    if (!nome || !m) return;
    push(id, 'exl', { tipo: nome, min: m });
    setTipo(''); setMin(null); setLivre(''); setOutro('');
  }

  return (
    <View style={{ gap: 10 }}>
      {l.map((a, i) => {
        const ic = (TIPOS.find(([n]) => n === a.tipo)?.[1] ?? 'fitness-outline') as any;
        return (
          <Row key={i} style={st.feito}>
            <View style={[st.icB, { backgroundColor: strong }]}><Ionicons name={ic} size={18} color="#fff" /></View>
            <Text style={st.feitoT}>{a.tipo}</Text>
            <Text style={st.feitoM}>{a.min} min</Text>
            <IconBtn icon="close" label={`Apagar ${a.tipo}`} size={16} onPress={() => remove(id, 'exl', i)} />
          </Row>
        );
      })}

      <T muted small>{l.length ? 'Fez mais alguma coisa?' : 'Que exercício você fez?'}</T>
      <View style={st.grid}>
        {TIPOS.map(([n, ic]) => {
          const on = tipo === n;
          return (
            <Pressable key={n} onPress={() => setTipo(on ? '' : n)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={[st.tipo, on && { backgroundColor: strong, borderColor: strong }]}>
              <Ionicons name={ic as any} size={16} color={on ? '#fff' : C.muted} />
              <Text style={[st.tipoT, on && { color: '#fff' }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>

      {tipo ? (
        <View style={{ gap: 8 }}>
          {tipo === 'Outro' ? (
            <TextInput value={outro} onChangeText={setOutro} placeholder="Qual? (ex.: futevôlei)" placeholderTextColor={C.placeholder} style={st.inp} accessibilityLabel="Qual exercício" />
          ) : null}
          <T muted small>Por quanto tempo?</T>
          <Row style={{ flexWrap: 'wrap', gap: 6 }}>
            {TEMPOS.map((m) => {
              const on = min === m;
              return (
                <Pressable key={m} onPress={() => { setMin(on ? null : m); setLivre(''); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={[st.tempo, on && { backgroundColor: strong, borderColor: strong }]}>
                  <Text style={[st.tipoT, on && { color: '#fff' }]}>{m} min</Text>
                </Pressable>
              );
            })}
            <TextInput value={livre} onChangeText={(v) => { setLivre(v.replace(/\D/g, '')); setMin(null); }} placeholder="outro" keyboardType="number-pad"
              placeholderTextColor={C.placeholder} style={[st.inp, { width: 78, minHeight: 38, textAlign: 'center' }]} accessibilityLabel="Minutos" />
          </Row>
          <Pressable onPress={add} disabled={!(min || parseInt(livre, 10))} accessibilityRole="button"
            style={[st.add, { backgroundColor: strong }, !(min || parseInt(livre, 10)) && { opacity: 0.4 }]}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={st.addT}>Anotar {tipo === 'Outro' ? (outro.trim() || 'exercício') : tipo.toLowerCase()}{min || parseInt(livre, 10) ? `, ${min ?? parseInt(livre, 10)} min` : ''}</Text>
          </Pressable>
        </View>
      ) : null}

      <T muted small style={{ marginTop: 4 }}>Como foi o esforço?</T>
      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        {EXER.filter((e) => e !== 'nenhum').map((e) => {
          const on = doc?.ex === e;
          return (
            <Pressable key={e} onPress={() => set(id, 'ex', on ? '' : e)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={[st.tempo, on && { backgroundColor: strong, borderColor: strong }]}>
              <Text style={[st.tipoT, on && { color: '#fff' }]}>{e}</Text>
            </Pressable>
          );
        })}
      </Row>

      {semana ? <T muted small>Nos últimos 7 dias: {semana >= 60 ? `${Math.floor(semana / 60)}h${semana % 60 ? String(semana % 60).padStart(2, '0') : ''}` : `${semana} min`} de movimento.</T> : null}
    </View>
  );
}

const st = StyleSheet.create({
  feito: { gap: 10, backgroundColor: C.bg, borderRadius: R.md, paddingLeft: 8, paddingRight: 4, minHeight: 48 },
  icB: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  feitoT: { flex: 1, fontFamily: F.bodyMed, fontSize: 15, color: C.ink },
  feitoM: { fontFamily: F.bodySemi, fontSize: 14, color: C.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, minHeight: 38, backgroundColor: C.surface },
  tipoT: { fontFamily: F.body, fontSize: 13, color: C.ink },
  tempo: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, minHeight: 38, justifyContent: 'center', backgroundColor: C.surface },
  inp: { fontFamily: F.body, fontSize: 14, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 10, minHeight: 42, backgroundColor: C.surface },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, minHeight: 46 },
  addT: { fontFamily: F.bodyMed, fontSize: 15, color: '#fff' },
});
