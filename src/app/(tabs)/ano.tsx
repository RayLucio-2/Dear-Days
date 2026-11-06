import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { fromKey, key, MESES, mkey } from '@/lib/dates';
import { COR, monthColor } from '@/lib/planner';
import { AREAS } from '@/lib/tools';
import { useWide } from '@/lib/layout';
import { Btn, Card, Field, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/** Plano do ano (y-AAAA): palavra, como quer se sentir, as 10 áreas e as metas de cada mês. */
export default function Ano() {
  const cur = useStore((s) => s.cur);
  const setCur = useStore((s) => s.setCur);
  const docs = useStore((s) => s.docs);
  const wide = useWide();
  const d = fromKey(cur);
  const y = d.getFullYear();
  const id = 'y-' + y;
  const [, strong] = monthColor(d);

  return (
    <Screen>
      <Row style={{ alignItems: 'flex-end', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.eyebrow, { color: strong }]}>Visão do ano</Text>
          <Text style={ui.h1}>{y}</Text>
        </View>
        <IconBtn icon="chevron-back" label="Ano anterior" onPress={() => setCur(`${y - 1}-01-01`)} />
        <IconBtn icon="chevron-forward" label="Próximo ano" onPress={() => setCur(`${y + 1}-01-01`)} />
      </Row>
      <T muted small style={{ marginBottom: 12 }}>Dê uma nota de 0 a 10 para cada área e escolha uma meta. Não precisa preencher todas.</T>

      <View style={wide ? st.cols : null}>
        <Card title="Minha palavra para o ano" style={wide ? { flex: 1 } : undefined}>
          <Field doc={id} path="word" placeholder="leveza" style={st.word} />
        </Card>
        <Card title="Em dezembro, quero estar…" style={wide ? { flex: 1 } : undefined}>
          <Field doc={id} path="feel" multiline placeholder="Como você quer se sentir no fim do ano" />
        </Card>
      </View>

      <Card title="Áreas da vida">
        {AREAS.map((a, i) => (
          <View key={a} style={[st.area, wide && { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <Row style={wide ? { width: 210 } : { justifyContent: 'space-between' }}>
              <Text style={st.areaN}>{a}</Text>
              <Field doc={id} path={`area.${i}.nota`} placeholder="0–10" keyboardType="number-pad" maxLength={2} style={st.nota} />
            </Row>
            <Field doc={id} path={`area.${i}.meta`} placeholder="Minha meta" />
            <Field doc={id} path={`area.${i}.passo`} placeholder="Primeiro passo" />
          </View>
        ))}
        <Btn kind="link" title="Ver a roda da vida" color={C.accent} onPress={() => router.navigate({ pathname: '/ferramenta', params: { k: 'roda' } })} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
      </Card>

      <View style={st.months}>
        {Array.from({ length: 12 }, (_, mm) => {
          const md = new Date(y, mm, 1);
          const gs = [0, 1, 2].map((i) => docs['m-' + mkey(md)]?.metas?.[i]?.t).filter(Boolean);
          return (
            <Pressable key={mm} onPress={() => { setCur(key(md)); router.navigate('/mes'); }} accessibilityRole="button"
              style={[st.month, { width: wide ? '32%' : '48%', backgroundColor: COR[mm][0] }]}>
              <Text style={st.mN}>{MESES[mm]}</Text>
              <Text style={st.mG} numberOfLines={4}>{gs.length ? gs.join('\n') : 'Sem metas ainda'}</Text>
            </Pressable>
          );
        })}
      </View>
      <T muted small style={{ textAlign: 'center' }}>Toque no mês para abrir as metas dele.</T>
    </Screen>
  );
}

const st = StyleSheet.create({
  cols: { flexDirection: 'row', gap: 12 },
  word: { fontFamily: F.title, fontSize: 30 },
  area: { borderBottomWidth: 1, borderBottomColor: C.hair, paddingVertical: 6 },
  areaN: { fontFamily: F.bodyMed, fontSize: 14, color: C.ink, flex: 1 },
  nota: { flex: 0, width: 56, textAlign: 'center' },
  months: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 10 },
  month: { borderRadius: R.lg, padding: 14, minHeight: 110 },
  mN: { fontFamily: F.title, fontSize: 20, color: C.ink, marginBottom: 4 },
  mG: { fontFamily: F.body, fontSize: 13, color: C.ink, lineHeight: 18 },
});
