import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { capture, success } from '@/lib/actions';
import { useStore } from '@/lib/store';
import { useTimer } from '@/lib/timer';
import { DIASL, key, today } from '@/lib/dates';
import { entender, Entendido } from '@/lib/fala';
import { addEntrada, addGasto } from '@/lib/fin';
import { brl } from '@/lib/money';
import { monthColor, VARIA } from '@/lib/planner';
import { Btn, Row } from './ui';
import { useWide } from '@/lib/layout';
import { C, F, R } from '@/lib/theme';

/**
 * Botão + que fica por cima de todas as abas. Anota em 2 segundos, sem data nem hora.
 * O que for anotado vai para a caixa de entrada (t-inbox) para organizar depois.
 * Também mostra o cronômetro quando ele está rodando.
 */
export function QuickCapture() {
  const ins = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState('');
  const [msg, setMsg] = useState('');
  const n = useStore((s) => (Array.isArray(s.docs['t-inbox']?.l) ? s.docs['t-inbox'].l.length : 0));
  const strong = monthColor(today())[1];
  const wide = useWide();
  const bottom = wide ? 24 : (Platform.OS === 'web' ? 70 : 52 + ins.bottom) + 16;
  const path = usePathname();
  const foco = useStore((s) => !!s.docs['t-cfg']?.app?.foco);
  const hideFab = path === '/dia' && foco; // o modo foco já tem o campo de anotar

  const e = entender(txt);

  function save(toToday: boolean) {
    const v = txt.trim();
    if (!v) return;
    if (toToday) useStore.getState().push('d-' + key(today()), 'tl', { time: '', end: '', t: v, desc: '', cat: 0, ok: false, sub: [] });
    else capture(v);
    success();
    setTxt('');
    setMsg(toToday ? 'Foi para as tarefas de hoje.' : 'Guardado na caixa de entrada.');
  }
  /** Salva do jeito que entendeu: gasto, entrada ou tarefa com data e hora. */
  function salvarEntendido(x: Entendido) {
    if (x.tipo === 'gasto') { addGasto(x.dia, x.valor, x.cat, x.desc); setMsg(`Gasto de ${brl(x.valor)} anotado em Finanças.`); }
    else if (x.tipo === 'entrada') { addEntrada(x.dia, x.valor, x.desc); setMsg(`Entrada de ${brl(x.valor)} anotada em Finanças.`); }
    else if (x.tipo === 'tarefa') { useStore.getState().push('d-' + key(x.dia), 'tl', { time: x.hora, end: '', t: x.t, desc: '', cat: 0, ok: false, sub: [] }); setMsg(`Tarefa marcada para ${quando(x.dia)}${x.hora ? ' às ' + x.hora : ''}.`); }
    else return;
    success();
    setTxt('');
  }

  return (
    <>
      <TimerPill bottom={bottom} left={wide ? 226 : 16} />
      {hideFab ? null : <Pressable onPress={() => { setMsg(''); setOpen(true); }} accessibilityRole="button" accessibilityLabel="Anotar rápido"
        style={({ pressed }) => [st.fab, { bottom, backgroundColor: strong }, pressed && { transform: [{ scale: 0.94 }] }]}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Fechar" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.sheetWrap} pointerEvents="box-none">
          <View style={[st.sheet, { paddingBottom: 18 + ins.bottom }]}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={st.h}>Anotar rápido</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Fechar"><Ionicons name="close" size={24} color={C.muted} /></Pressable>
            </Row>
            <TextInput value={txt} onChangeText={(v) => { setTxt(v); setMsg(''); }} autoFocus placeholder="O que veio na cabeça?" placeholderTextColor={C.placeholder}
              style={st.input} onSubmitEditing={() => (e.tipo !== 'nada' ? salvarEntendido(e) : save(false))} returnKeyType="done" blurOnSubmit={false} accessibilityLabel="O que anotar" />
            {e.tipo !== 'nada' ? (
              <View style={st.entendi}>
                <Ionicons name={e.tipo === 'tarefa' ? 'calendar-outline' : e.tipo === 'gasto' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} size={18} color={strong} />
                <Text style={st.entendiT}>{descreve(e)}</Text>
              </View>
            ) : msg ? <Text style={st.msg}>{msg} Pode anotar outra.</Text> : <Text style={st.hint}>Escreva do seu jeito: “dentista amanhã 15h”, “gastei 32 no mercado”.</Text>}
            {e.tipo !== 'nada' ? (
              <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                <Btn title={e.tipo === 'tarefa' ? 'Salvar tarefa' : e.tipo === 'gasto' ? 'Salvar gasto' : 'Salvar entrada'} icon="checkmark" onPress={() => salvarEntendido(e)} color={strong} style={{ flex: 1 }} />
                <Btn kind="soft" title="Só guardar" onPress={() => save(false)} color={C.ink} />
              </Row>
            ) : (
              <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                <Btn title="Guardar" icon="file-tray-outline" onPress={() => save(false)} color={strong} disabled={!txt.trim()} style={{ flex: 1 }} />
                <Btn kind="soft" title="Já é para hoje" onPress={() => save(true)} disabled={!txt.trim()} color={C.ink} />
              </Row>
            )}
            <Btn kind="link" title={n ? `Abrir caixa de entrada (${n})` : 'Abrir caixa de entrada'} color={C.accent}
              onPress={() => { setOpen(false); router.push('/caixa'); }} style={{ alignSelf: 'center', marginTop: 4 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function TimerPill({ bottom, left: leftPx }: { bottom: number; left: number }) {
  const run = useTimer((t) => t.run);
  const path = usePathname();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [run]);
  if (!run || path === '/dia') return null; // no Dia o disco já aparece
  const left = Math.max(0, Math.ceil((run.dur - (now - run.startAt)) / 1000));
  return (
    <Pressable onPress={() => { useStore.getState().setCur(run.day); router.navigate('/dia'); }} accessibilityRole="button"
      accessibilityLabel={`Cronômetro: ${run.label}`} style={[st.pill, { bottom: bottom + 10, left: leftPx }]}>
      <Ionicons name="hourglass-outline" size={15} color={C.ink} />
      <Text style={st.pillT} numberOfLines={1}>{left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'pronto'} · {run.label}</Text>
    </Pressable>
  );
}

function quando(d: Date) {
  const hoje = today();
  const dif = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()) / 864e5);
  if (dif === 0) return 'hoje';
  if (dif === 1) return 'amanhã';
  if (dif === -1) return 'ontem';
  return `${DIASL[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function descreve(e: Entendido) {
  if (e.tipo === 'tarefa') return `Tarefa: ${e.t}, ${quando(e.dia)}${e.hora ? ' às ' + e.hora : ''}`;
  if (e.tipo === 'gasto') return `Gasto de ${brl(e.valor)} em ${VARIA[e.cat]}${e.desc && e.desc.toLowerCase() !== VARIA[e.cat].toLowerCase() ? ` (${e.desc})` : ''}${quando(e.dia) !== 'hoje' ? ', ' + quando(e.dia) : ''}`;
  if (e.tipo === 'entrada') return `Entrada de ${brl(e.valor)}${e.desc ? `: ${e.desc}` : ''}`;
  return '';
}

const st = StyleSheet.create({
  entendi: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.sand, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 10 },
  entendiT: { flex: 1, fontFamily: F.bodyMed, fontSize: 14, color: C.ink },
  fab: { position: 'absolute', right: 20, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3A2E26', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  pill: { position: 'absolute', left: 16, right: 92, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 999,
    borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, minHeight: 38, shadowColor: '#3A2E26', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  pillT: { flex: 1, fontFamily: F.bodyMed, fontSize: 13, color: C.ink, fontVariant: ['tabular-nums'] },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(47,43,39,0.35)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, gap: 10, width: '100%', maxWidth: 760, alignSelf: 'center' },
  h: { fontFamily: F.title, fontSize: 24, color: C.ink },
  input: { fontFamily: F.body, fontSize: 17, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 14, minHeight: 52, backgroundColor: C.bg },
  hint: { fontFamily: F.body, fontSize: 13, color: C.muted },
  msg: { fontFamily: F.bodyMed, fontSize: 13, color: C.ok },
});
