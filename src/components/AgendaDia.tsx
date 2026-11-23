import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { Evento, eventosDoDia } from '@/lib/agenda';
import { Task } from '@/lib/planner';
import { T } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/** "Da sua agenda": compromissos do Google Agenda no dia, com botão para trazer como tarefa. */
export function AgendaDia({ id, strong }: { id: string; strong: string }) {
  const url: string | undefined = useStore((s) => s.docs['t-cfg']?.app?.ical);
  const tl: Task[] = useStore((s) => s.docs[id]?.tl) || [];
  const dia = id.slice(2);
  const [ev, setEv] = useState<Evento[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    if (!url) return;
    eventosDoDia(url, dia).then((e) => { if (vivo) { setEv(e); setErro(''); } }).catch((e) => { if (vivo) setErro(e.message); });
    return () => { vivo = false; };
  }, [url, dia]);

  if (!url) return null;
  if (erro) return <T muted small style={{ marginBottom: 8 }}>Agenda: {erro}</T>;
  if (!ev || !ev.length) return null;
  const jaTem = (e: Evento) => tl.some((t) => t?.t === e.title && (t.time || '') === (e.start || ''));

  return (
    <View style={st.box}>
      <Pressable onPress={() => router.push('/conta')} accessibilityRole="button">
        <Text style={st.h}>Da sua agenda</Text>
      </Pressable>
      {ev.map((e, i) => {
        const tem = jaTem(e);
        return (
          <View key={i} style={st.row}>
            <Text style={st.time}>{e.allDay ? 'dia todo' : `${e.start}${e.end ? '–' + e.end : ''}`}</Text>
            <Text style={st.t} numberOfLines={2}>{e.title}</Text>
            <Pressable disabled={tem} accessibilityLabel={tem ? 'Já está nas tarefas' : `Trazer ${e.title} para as tarefas`} hitSlop={8}
              onPress={() => useStore.getState().push(id, 'tl', { time: e.start || '', end: e.end || '', t: e.title, desc: '', cat: 0, ok: false, sub: [] })}>
              <Ionicons name={tem ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={tem ? C.faint : strong} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  box: { backgroundColor: C.glass, borderRadius: R.md, padding: 12, marginBottom: 12, gap: 6 },
  h: { fontFamily: F.bodySemi, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 34 },
  time: { fontFamily: F.bodyMed, fontSize: 13, color: C.muted, width: 86 },
  t: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
});
