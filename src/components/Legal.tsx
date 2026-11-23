import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { RESPONSAVEL, Secao } from '@/lib/legal';
import { IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { C, F } from '@/lib/theme';

export function Legal({ titulo, secoes }: { titulo: string; secoes: Secao[] }) {
  return (
    <Screen>
      <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={ui.h1}>{titulo}</Text>
          <IconBtn icon="close" label="Fechar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} size={26} color={C.ink} />
        </Row>
        <T muted small style={{ marginBottom: 18 }}>Dear Days · atualizado em {RESPONSAVEL.atualizado}</T>
        {secoes.map((s) => (
          <View key={s.t} style={{ marginBottom: 18 }}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 16, color: C.ink, marginBottom: 6 }}>{s.t}</Text>
            {s.p.map((p, i) => <T key={i} style={{ lineHeight: 23, marginBottom: 6 }}>{p}</T>)}
          </View>
        ))}
      </View>
    </Screen>
  );
}
