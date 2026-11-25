import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { fromKey, MESES, mkey, today } from '@/lib/dates';
import { brl } from '@/lib/money';
import { monthColor, VARIA } from '@/lib/planner';
import { addEntrada, addGasto } from '@/lib/fin';
import { decodificar, Lanc, lerArquivo, Lido, trocarTipo, Tipo } from '@/lib/extrato';
import { success } from '@/lib/actions';
import { Btn, Card, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

/** Identificador curto e sem pontos (pontos viram caminho no banco de dados). */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
};
const br = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

const AJUDA: [string, string][] = [
  ['Nubank', 'No app, abra a fatura e toque em “Exportar fatura”: chega um CSV no seu e-mail. Para a conta, em “Extrato” escolha exportar em CSV.'],
  ['Inter, C6, PicPay', 'Em Extrato, toque em exportar ou compartilhar e escolha OFX, CSV ou Excel.'],
  ['Itaú, Bradesco, Santander, Banco do Brasil, Caixa', 'No internet banking pelo computador, abra o extrato ou a fatura e salve em OFX (às vezes aparece como “Money” ou “Quicken”).'],
  ['Só tem PDF?', 'Procure “exportar” ou “salvar como” no app ou no site do banco. PDF ainda não dá para ler.'],
];

export default function Importar() {
  const docs = useStore((s) => s.docs);
  const [, strong] = monthColor(today());
  const [lido, setLido] = useState<Lido | null>(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [feito, setFeito] = useState('');
  const [abreCat, setAbreCat] = useState<string | null>(null);
  const [noMesFatura, setNoMesFatura] = useState(true);
  const [ajuda, setAjuda] = useState(false);

  /** Lançamentos que já entraram antes (guardados em f-AAAA-MM.imp). */
  const ja = useMemo(() => {
    const s = new Set<string>();
    Object.entries(docs).forEach(([k, v]: [string, any]) => { if (k.startsWith('f-') && v?.imp) Object.keys(v.imp).forEach((x) => s.add(x)); });
    return s;
  }, [docs]);

  const mesFatura = useMemo(() => {
    if (!lido?.itens.length) return mkey(today());
    return lido.itens.map((x) => x.data).sort().pop()!.slice(0, 7);
  }, [lido]);

  async function escolher() {
    setErro(''); setFeito('');
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    try {
      const a: any = res.assets[0];
      let buf: ArrayBuffer;
      if (Platform.OS === 'web' && a.file) buf = await a.file.arrayBuffer();
      else { const u = await new File(a.uri).bytes(); buf = u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer; }
      const r = lerArquivo(decodificar(buf), a.name || '');
      r.itens = r.itens.map((x) => (ja.has(hash(x.id)) ? { ...x, incluir: false, aviso: 'já importado antes' } : x));
      setLido(r); setNome(a.name || 'arquivo');
    } catch (e) {
      setErro((e as Error).message || 'Não consegui ler esse arquivo.');
      setLido(null);
    } finally {
      setBusy(false);
    }
  }

  const mudar = (id: string, fn: (x: Lanc) => Lanc) => setLido((l) => (l ? { ...l, itens: l.itens.map((x) => (x.id === id ? fn(x) : x)) } : l));
  const sel = lido?.itens.filter((x) => x.incluir) ?? [];
  const gastos = sel.filter((x) => x.valor > 0), entradas = sel.filter((x) => x.valor < 0);
  const somaG = gastos.reduce((a, x) => a + x.valor, 0), somaE = entradas.reduce((a, x) => a - x.valor, 0);
  const fatura = lido?.tipo === 'fatura';

  function importar() {
    if (!lido) return;
    const { set } = useStore.getState();
    const diaFatura = fromKey(mesFatura + '-' + String(Math.min(28, today().getDate())).padStart(2, '0'));
    sel.forEach((x) => {
      const dia = fatura && noMesFatura ? diaFatura : fromKey(x.data);
      if (x.valor > 0) addGasto(dia, x.valor, x.cat, x.desc);
      else addEntrada(dia, -x.valor, x.desc);
      set('f-' + mkey(dia), `imp.${hash(x.id)}`, true);
    });
    success();
    setFeito(`${sel.length} lançamento${sel.length === 1 ? '' : 's'} importado${sel.length === 1 ? '' : 's'}: ${brl(somaG)} em gastos${somaE ? ` e ${brl(somaE)} em entradas` : ''}.`);
    setLido(null);
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={ui.h1}>Importar</Text>
        <IconBtn icon="close" label="Fechar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/financas'))} size={26} color={C.ink} />
      </Row>
      <T muted style={{ marginBottom: 16, lineHeight: 21 }}>
        Traga o extrato da conta ou a fatura do cartão e o Dear Days separa os gastos por categoria. O arquivo é lido aqui mesmo: nada é enviado, só os lançamentos que você confirmar.
      </T>

      {!lido ? (
        <>
          <Btn title={busy ? 'Lendo...' : 'Escolher arquivo (OFX ou CSV)'} icon="document-text-outline" color={strong} onPress={escolher} disabled={busy} style={{ minHeight: 52 }} />
          {erro ? <T style={{ marginTop: 12, color: C.danger, lineHeight: 21 }}>{erro}</T> : null}
          {feito ? (
            <Card style={{ marginTop: 14 }}>
              <Row style={{ gap: 10 }}><Ionicons name="checkmark-circle" size={22} color={C.ok} /><T style={{ flex: 1, lineHeight: 21 }}>{feito}</T></Row>
              <Btn kind="link" title="Ver em Finanças" color={C.accent} onPress={() => router.replace('/financas')} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
            </Card>
          ) : null}
          <Pressable onPress={() => setAjuda(!ajuda)} accessibilityRole="button" style={{ marginTop: 18 }}>
            <Row style={{ gap: 6 }}>
              <Ionicons name={ajuda ? 'chevron-down' : 'chevron-forward'} size={16} color={C.accent} />
              <Text style={{ fontFamily: F.bodyMed, fontSize: 14, color: C.accent }}>Como baixar o arquivo do meu banco</Text>
            </Row>
          </Pressable>
          {ajuda ? (
            <View style={{ gap: 12, marginTop: 12 }}>
              {AJUDA.map(([b, t]) => (
                <View key={b}><Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.ink }}>{b}</Text><T muted style={{ lineHeight: 20 }}>{t}</T></View>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Card>
            <T muted small>{nome} · {lido.formato}{lido.banco ? ` · ${lido.banco}` : ''}</T>
            <Row style={{ gap: 8, marginTop: 10 }}>
              {([['extrato', 'Extrato da conta'], ['fatura', 'Fatura do cartão']] as [Tipo, string][]).map(([k, n]) => (
                <Pressable key={k} onPress={() => setLido(trocarTipo(lido, k))} accessibilityRole="radio" accessibilityState={{ selected: lido.tipo === k }}
                  style={[st.seg, lido.tipo === k && { backgroundColor: strong, borderColor: strong }]}>
                  <Text style={[st.segT, lido.tipo === k && { color: '#fff' }]}>{n}</Text>
                </Pressable>
              ))}
            </Row>
            {fatura ? (
              <Row style={{ marginTop: 12, gap: 10 }}>
                <T style={{ flex: 1, lineHeight: 20 }}>Contar tudo no mês da fatura ({MESES[Number(mesFatura.slice(5, 7)) - 1].toLowerCase()})</T>
                <Switch value={noMesFatura} onValueChange={setNoMesFatura} trackColor={{ true: strong }} accessibilityLabel="Contar tudo no mês da fatura" />
              </Row>
            ) : null}
            <Row style={{ gap: 8, marginTop: 14 }}>
              <View style={st.tile}><Text style={st.tileL}>{gastos.length} gasto{gastos.length === 1 ? '' : 's'}</Text><Text style={st.tileV}>{brl(somaG)}</Text></View>
              <View style={st.tile}><Text style={st.tileL}>{entradas.length} entrada{entradas.length === 1 ? '' : 's'}</Text><Text style={[st.tileV, { color: C.ok }]}>{brl(somaE)}</Text></View>
            </Row>
            <T muted small style={{ marginTop: 10, lineHeight: 18 }}>
              Vieram desmarcados: pagamento de fatura, transferências entre contas, estornos e o que parece conta fixa (para não contar duas vezes). Marque se quiser incluir.
            </T>
          </Card>

          {lido.itens.map((x) => {
            const entrada = x.valor < 0;
            return (
              <View key={x.id} style={[st.row, !x.incluir && { opacity: 0.55 }]}>
                <Row style={{ gap: 10 }}>
                  <Pressable onPress={() => mudar(x.id, (y) => ({ ...y, incluir: !y.incluir }))} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: x.incluir }} accessibilityLabel={x.desc}>
                    <Ionicons name={x.incluir ? 'checkbox' : 'square-outline'} size={24} color={x.incluir ? strong : C.faint} />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={st.desc} numberOfLines={2}>{x.desc}</Text>
                    <Row style={{ gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                      <Text style={st.meta}>{br(x.data)}</Text>
                      {!entrada ? (
                        <Pressable onPress={() => setAbreCat(abreCat === x.id ? null : x.id)} accessibilityRole="button" accessibilityLabel={`Categoria: ${VARIA[x.cat]}`} style={st.cat}>
                          <Text style={st.catT}>{VARIA[x.cat]}</Text><Ionicons name="chevron-down" size={12} color={C.muted} />
                        </Pressable>
                      ) : <Text style={[st.meta, { color: C.ok }]}>{fatura ? 'crédito' : 'entrada'}</Text>}
                      {x.aviso ? <Text style={st.aviso}>{x.aviso}</Text> : null}
                    </Row>
                  </View>
                  <Text style={[st.val, entrada && { color: C.ok }]}>{entrada ? '+' : ''}{brl(Math.abs(x.valor))}</Text>
                </Row>
                {abreCat === x.id ? (
                  <View style={st.cats}>
                    {VARIA.map((n, i) => (
                      <Pressable key={n} onPress={() => { mudar(x.id, (y) => ({ ...y, cat: i })); setAbreCat(null); }} accessibilityRole="radio" accessibilityState={{ selected: x.cat === i }}
                        style={[st.chip, x.cat === i && { backgroundColor: strong, borderColor: strong }]}>
                        <Text style={[st.chipT, x.cat === i && { color: '#fff' }]}>{n}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          <View style={{ gap: 8, marginTop: 14 }}>
            <Btn title={sel.length ? `Importar ${sel.length} lançamento${sel.length === 1 ? '' : 's'}` : 'Nada marcado'} icon="checkmark" color={strong} onPress={importar} disabled={!sel.length} style={{ minHeight: 52 }} />
            <Btn kind="link" title="Escolher outro arquivo" color={C.muted} onPress={() => { setLido(null); escolher(); }} />
          </View>
        </>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  seg: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 999, minHeight: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  segT: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink },
  tile: { flex: 1, backgroundColor: C.bg, borderRadius: R.md, padding: 12, gap: 2 },
  tileL: { fontFamily: F.body, fontSize: 12, color: C.muted },
  tileV: { fontFamily: F.bodySemi, fontSize: 18, color: C.ink },
  row: { backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  desc: { fontFamily: F.body, fontSize: 15, color: C.ink },
  meta: { fontFamily: F.body, fontSize: 12, color: C.muted },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.sand, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  catT: { fontFamily: F.body, fontSize: 12, color: C.ink },
  aviso: { fontFamily: F.body, fontSize: 12, color: C.muted, fontStyle: 'italic' },
  val: { fontFamily: F.bodySemi, fontSize: 15, color: C.ink, fontVariant: ['tabular-nums'] },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 10, minHeight: 32, justifyContent: 'center', backgroundColor: C.bg },
  chipT: { fontFamily: F.body, fontSize: 12, color: C.ink },
});
