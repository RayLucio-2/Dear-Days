import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { capture, inboxTo, InboxItem, tomorrowOf } from '@/lib/actions';
import { key, today } from '@/lib/dates';
import { monthColor } from '@/lib/planner';
import { Btn, Card, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { C, F } from '@/lib/theme';

/** Caixa de entrada: tudo que foi anotado rápido, até você decidir o que fazer. */
export default function Caixa() {
  const raw = useStore((s) => s.docs['t-inbox']?.l);
  const l: InboxItem[] = Array.isArray(raw) ? raw : [];
  const remove = useStore((s) => s.remove);
  const [txt, setTxt] = useState('');
  const strong = monthColor(today())[1];
  const hoje = key(today());

  const quando = (iso: string) => {
    const d = new Date(iso);
    const k = key(d);
    const h = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return k === hoje ? `hoje, ${h}` : `${d.getDate()}/${d.getMonth() + 1}, ${h}`;
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={ui.h1}>Caixa de entrada</Text>
        <IconBtn icon="close" label="Fechar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} size={26} color={C.ink} />
      </Row>
      <T muted style={{ marginBottom: 14 }}>O que você anotou no botão +. Organize quando der, por exemplo à noite.</T>

      <Row style={{ marginBottom: 14 }}>
        <TextInput value={txt} onChangeText={setTxt} onSubmitEditing={() => { capture(txt); setTxt(''); }} placeholder="Anotar mais uma coisa" placeholderTextColor={C.placeholder}
          style={[ui.input, { backgroundColor: C.surface, borderBottomWidth: 0, borderRadius: 14, paddingHorizontal: 14 }]} returnKeyType="done" blurOnSubmit={false} />
        <Btn title="Guardar" onPress={() => { capture(txt); setTxt(''); }} color={strong} disabled={!txt.trim()} />
      </Row>

      {!l.length ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontFamily: F.title, fontSize: 24, color: C.ink, marginTop: 8 }}>Caixa vazia</Text>
          <T muted>Sua cabeça agradece.</T>
        </Card>
      ) : (
        l.map((x, i) => (
          <Card key={x.id} style={{ paddingVertical: 12 }}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[ui.t, { fontFamily: F.bodyMed, fontSize: 16 }]}>{x.t}</Text>
                <T muted small>anotado {quando(x.at)}</T>
              </View>
              <IconBtn icon="trash-outline" label="Apagar" onPress={() => remove('t-inbox', 'l', i)} />
            </Row>
            <Row style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <Btn kind="soft" title="Hoje" icon="sunny-outline" onPress={() => inboxTo(i, hoje)} color={strong} style={{ minHeight: 36 }} />
              <Btn kind="soft" title="Amanhã" icon="arrow-forward-outline" onPress={() => inboxTo(i, tomorrowOf(hoje))} color={C.ink} style={{ minHeight: 36 }} />
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
