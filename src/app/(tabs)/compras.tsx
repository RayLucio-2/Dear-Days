import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { today } from '@/lib/dates';
import { HAB_CORES, monthColor, uid } from '@/lib/planner';
import { Btn, H1, IconBtn, Row, Screen, T } from '@/components/ui';
import { C, F, R } from '@/lib/theme';
import { tap } from '@/lib/actions';

type Item = { id: string; t: string; ok?: boolean };
type Secao = { id: string; n: string; cor: number; itens: Item[] };

/** Seções do mercado. A lista é reaproveitada: depois da compra, "Nova compra" desmarca tudo. */
const PADRAO: [string, number][] = [
  ['Hortifrúti', 5], ['Açougue e peixaria', 0], ['Laticínios e frios', 2], ['Mercearia', 3], ['Padaria', 4],
  ['Congelados', 1], ['Limpeza', 1], ['Higiene', 3], ['Bebidas', 0],
];

export default function Compras() {
  const raw = useStore((s) => s.docs['t-compras']?.sec);
  const { set } = useStore.getState();
  const [, strong] = monthColor(today());
  const secs: Secao[] = Array.isArray(raw) && raw.length ? raw : PADRAO.map(([n, cor]) => ({ id: n, n, cor, itens: [] }));
  const salvar = (l: Secao[]) => set('t-compras', 'sec', l);
  const tot = secs.reduce((a, s) => a + s.itens.length, 0);
  const ok = secs.reduce((a, s) => a + s.itens.filter((i) => i.ok).length, 0);
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState(false);

  const mudar = (si: number, fn: (s: Secao) => Secao) => salvar(secs.map((s, i) => (i === si ? fn(s) : s)));

  return (
    <Screen>
      <H1 sub="Casa" color={strong}>Lista de compras</H1>
      <Row style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', rowGap: 8 }}>
        <T muted>{tot ? `${ok} de ${tot} no carrinho` : 'Anote o que falta em casa, cada coisa na sua seção.'}</T>
        {ok ? (
          confirma ? (
            <Row style={{ gap: 12 }}>
              <Btn kind="link" title="Desmarcar tudo" color={strong} onPress={() => { salvar(secs.map((s) => ({ ...s, itens: s.itens.map((i) => ({ ...i, ok: false })) }))); setConfirma(false); }} />
              <Btn kind="link" title="Tirar o que comprei" color={C.muted} onPress={() => { salvar(secs.map((s) => ({ ...s, itens: s.itens.filter((i) => !i.ok) }))); setConfirma(false); }} />
            </Row>
          ) : <Btn kind="soft" title="Nova compra" icon="refresh-outline" color={strong} onPress={() => setConfirma(true)} style={{ minHeight: 38 }} />
        ) : null}
      </Row>

      <View style={st.grid}>
        {secs.map((s, si) => <SecaoCard key={s.id} s={s} onChange={(fn) => mudar(si, fn)} onRemove={() => salvar(secs.filter((_, i) => i !== si))} />)}
      </View>

      <Row style={{ marginTop: 6, gap: 8 }}>
        <TextInput value={nova} onChangeText={setNova} placeholder="Nova seção (ex.: Pet)" placeholderTextColor={C.placeholder} style={[st.inp, { flex: 1 }]}
          onSubmitEditing={() => { if (!nova.trim()) return; salvar([...secs, { id: uid('s'), n: nova.trim(), cor: secs.length % HAB_CORES.length, itens: [] }]); setNova(''); }} />
        <Btn kind="soft" title="Criar" color={strong} disabled={!nova.trim()}
          onPress={() => { salvar([...secs, { id: uid('s'), n: nova.trim(), cor: secs.length % HAB_CORES.length, itens: [] }]); setNova(''); }} />
      </Row>
    </Screen>
  );
}

function SecaoCard({ s, onChange, onRemove }: { s: Secao; onChange: (fn: (s: Secao) => Secao) => void; onRemove: () => void }) {
  const [txt, setTxt] = useState('');
  const [fundo, , forte] = HAB_CORES[s.cor % HAB_CORES.length].c;
  const add = () => {
    const v = txt.trim();
    if (!v) return;
    onChange((x) => ({ ...x, itens: [...x.itens, ...v.split(/\s*,\s*/).filter(Boolean).map((t) => ({ id: uid('c'), t }))] }));
    setTxt('');
  };
  const feitos = s.itens.filter((i) => i.ok).length;
  return (
    <View style={st.card}>
      <Row style={[st.head, { backgroundColor: forte }]}>
        <Text style={st.headT} numberOfLines={1}>{s.n}</Text>
        <Text style={st.headN}>{feitos}/{s.itens.length}</Text>
        {!s.itens.length ? <IconBtn icon="close" label={`Apagar seção ${s.n}`} color="#fff" size={18} onPress={onRemove} /> : null}
      </Row>
      <View style={{ padding: 12, gap: 2, backgroundColor: fundo }}>
        {s.itens.map((it) => (
          <Row key={it.id} style={{ minHeight: 38 }}>
            <Pressable style={st.it} hitSlop={4} accessibilityRole="checkbox" accessibilityState={{ checked: !!it.ok }}
              onPress={() => { tap(); onChange((x) => ({ ...x, itens: x.itens.map((i) => (i.id === it.id ? { ...i, ok: !i.ok } : i)) })); }}>
              <Ionicons name={it.ok ? 'checkbox' : 'square-outline'} size={22} color={it.ok ? forte : C.faint} />
              <Text style={[st.itT, it.ok && { textDecorationLine: 'line-through', color: C.muted }]}>{it.t}</Text>
            </Pressable>
            <IconBtn icon="close" label={`Apagar ${it.t}`} size={16} onPress={() => onChange((x) => ({ ...x, itens: x.itens.filter((i) => i.id !== it.id) }))} />
          </Row>
        ))}
        <TextInput value={txt} onChangeText={setTxt} onSubmitEditing={add} blurOnSubmit={false} returnKeyType="done"
          placeholder="+ adicionar (pode separar por vírgula)" placeholderTextColor={C.placeholder} style={st.add} accessibilityLabel={`Adicionar em ${s.n}`} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexGrow: 1, flexBasis: 260, borderRadius: R.md, overflow: 'hidden', backgroundColor: C.surface },
  head: { paddingHorizontal: 14, minHeight: 44, gap: 8 },
  headT: { flex: 1, fontFamily: F.bodySemi, fontSize: 15, color: '#fff' },
  headN: { fontFamily: F.bodyMed, fontSize: 13, color: '#fff' },
  it: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itT: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
  add: { fontFamily: F.body, fontSize: 14, color: C.ink, minHeight: 40, paddingHorizontal: 4 },
  inp: { fontFamily: F.body, fontSize: 15, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 12, minHeight: 44, backgroundColor: C.surface },
});
