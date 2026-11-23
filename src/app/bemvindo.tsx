import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSignedIn } from '@/lib/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { key, today } from '@/lib/dates';
import { monthColor, MOODN } from '@/lib/planner';
import { DEF_HOME, HOME_BLOCKS } from '@/lib/prefs';
import { Face } from '@/components/art';
import { Btn, Row, Screen, T } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

const PASSOS = 3;
/** Blocos que fazem sentido escolher no primeiro dia (os outros ficam em Personalizar). */
const OPCOES = HOME_BLOCKS.filter(([k]) => ['hoje', 'potinho', 'tarefas', 'habitos', 'metas', 'financas', 'emocoes', 'caixa', 'atalhos'].includes(k));

/** Primeiro acesso: 3 passos curtos. Pode pular a qualquer momento. */
export default function BemVindo() {
  const [, strong] = monthColor(today());
  const dayId = 'd-' + key(today());
  const { set, push } = useStore.getState();
  const [passo, setPasso] = useState(0);
  const [humor, setHumor] = useState(0);
  const [tarefa, setTarefa] = useState('');
  const [primeiro, setPrimeiro] = useState('');
  const [home, setHome] = useState<string[]>(DEF_HOME);
  const signed = useSignedIn();
  if (!signed) return <Redirect href="/login" />;

  function concluir() {
    if (humor) set(dayId, 'mood', humor);
    if (tarefa.trim()) push(dayId, 'tl', { time: '', end: '', t: tarefa.trim(), desc: '', cat: 0, ok: false, sub: [], first: primeiro.trim() || undefined });
    set('t-cfg', 'home', home.length ? home : DEF_HOME);
    set('t-cfg', 'app.boas', true);
    router.replace('/');
  }
  function pular() {
    set('t-cfg', 'app.boas', true);
    router.replace('/');
  }
  const prox = () => (passo < PASSOS - 1 ? setPasso(passo + 1) : concluir());

  return (
    <Screen>
      <View style={st.wrap}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 26 }}>
          <Row style={{ gap: 6 }}>
            {Array.from({ length: PASSOS }, (_, i) => (
              <View key={i} style={[st.dot, { backgroundColor: i <= passo ? strong : C.line, width: i === passo ? 26 : 8 }]} />
            ))}
          </Row>
          <Btn kind="link" title="Pular" color={C.muted} onPress={pular} />
        </Row>

        {passo === 0 ? (
          <>
            <Text style={st.eyebrow}>Boas-vindas ao Dear Days</Text>
            <Text style={st.h}>Como você está hoje?</Text>
            <T muted style={st.p}>Sem resposta certa. Isso ajuda você a perceber os seus dias com o tempo.</T>
            <View style={st.moods}>
              {MOODN.map((n, i) => {
                const on = humor === i + 1;
                return (
                  <Pressable key={n} onPress={() => setHumor(on ? 0 : i + 1)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={n}
                    style={[st.mood, on && { backgroundColor: C.surface, borderColor: strong }]}>
                    <Face i={i} size={40} />
                    <Text style={st.moodT}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : passo === 1 ? (
          <>
            <Text style={st.eyebrow}>Só uma coisa</Text>
            <Text style={st.h}>O que você quer fazer hoje?</Text>
            <T muted style={st.p}>Escolha uma tarefa só. Pequena já está ótimo.</T>
            <TextInput value={tarefa} onChangeText={setTarefa} placeholder="Ex.: responder o e-mail da escola" placeholderTextColor={C.placeholder}
              style={st.inp} autoFocus accessibilityLabel="Tarefa de hoje" onSubmitEditing={prox} />
            <Text style={st.label}>Qual é o primeiro passo? (opcional)</Text>
            <TextInput value={primeiro} onChangeText={setPrimeiro} placeholder="Ex.: abrir o e-mail" placeholderTextColor={C.placeholder}
              style={st.inp} accessibilityLabel="Primeiro passo" onSubmitEditing={prox} />
            <T muted small style={{ marginTop: 10, lineHeight: 19 }}>Começar fica mais fácil quando o primeiro passo é bem pequeno.</T>
          </>
        ) : (
          <>
            <Text style={st.eyebrow}>Do seu jeito</Text>
            <Text style={st.h}>O que você quer ver no Início?</Text>
            <T muted style={st.p}>Menos coisa na tela, menos distração. Dá para mudar depois em Personalizar.</T>
            <View style={{ gap: 8 }}>
              {OPCOES.map(([k, n]) => {
                const on = home.includes(k);
                return (
                  <Pressable key={k} onPress={() => setHome(on ? home.filter((x) => x !== k) : [...home, k])}
                    accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={[st.opt, on && { borderColor: strong }]}>
                    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? strong : C.faint} />
                    <Text style={st.optT}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Row style={{ marginTop: 28, gap: 14 }}>
          {passo > 0 ? <Btn kind="link" title="Voltar" color={C.muted} onPress={() => setPasso(passo - 1)} /> : null}
          <Btn title={passo < PASSOS - 1 ? 'Continuar' : 'Começar'} icon={passo < PASSOS - 1 ? 'arrow-forward' : 'checkmark'} color={strong} onPress={prox} style={{ flex: 1, minHeight: 50 }} />
        </Row>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  wrap: { maxWidth: 520, width: '100%', alignSelf: 'center', paddingTop: 12 },
  dot: { height: 8, borderRadius: 4 },
  eyebrow: { fontFamily: F.bodySemi, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.4 },
  h: { fontFamily: F.title, fontSize: 34, color: C.ink, marginTop: 6, lineHeight: 40 },
  p: { marginTop: 8, marginBottom: 20, lineHeight: 22 },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mood: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: R.lg, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: C.glass },
  moodT: { fontFamily: F.body, fontSize: 13, color: C.ink },
  inp: { fontFamily: F.body, fontSize: 17, color: C.ink, backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 16, minHeight: 54 },
  label: { fontFamily: F.bodyMed, fontSize: 14, color: C.muted, marginTop: 18, marginBottom: 8 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 16, minHeight: 52, borderWidth: 1.5, borderColor: 'transparent' },
  optT: { fontFamily: F.body, fontSize: 15, color: C.ink },
});
