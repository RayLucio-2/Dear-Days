import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { addEntrada, addGasto, historico, pendentes } from '@/lib/fin';
import { categoriaDe } from '@/lib/fala';
import { success } from '@/lib/actions';
import { useStore } from '@/lib/store';
import { fromKey, key, mkey, today } from '@/lib/dates';
import { brl, num, toBR } from '@/lib/money';
import { endLabel, finSums, FIXAS, monthColor, oxList, parcList, parcOf, uid, VARIA } from '@/lib/planner';
import { Btn, Card, DocCheck, Field, Fold, IconBtn, Row, Screen, T, Total, s as ui } from '@/components/ui';
import { MonthNav } from '@/components/MonthNav';
import { C, F, R } from '@/lib/theme';

export default function Financas() {
  const cur = useStore((s) => s.cur);
  const docs = useStore((s) => s.docs);
  const d = fromKey(cur);
  const id = 'f-' + mkey(d);
  const S = finSums(docs, d);
  const [, strong] = monthColor(d);
  const pend = pendentes(docs, d);
  const falta = pend.reduce((t, x) => t + x.v, 0);
  const saiu = S.out - falta;
  const hist = historico(docs, d);
  const [lanc, setLanc] = useState<'gasto' | 'entrada' | null>(null);
  const [todas, setTodas] = useState(false);
  const { set } = useStore.getState();
  const diaLanc = key(today()).slice(0, 7) === mkey(d) ? today() : d;

  return (
    <Screen>
      <MonthNav eyebrow="Finanças" />
      <T muted small style={{ marginTop: -8, marginBottom: 12 }}>Digite os valores com vírgula, como 1.250,90.</T>

      <View style={st.hero}>
        <Text style={st.heroL}>{S.bal >= 0 ? 'Sobra prevista no mês' : 'Falta no mês'}</Text>
        <Text style={[st.heroV, S.bal < 0 && { color: C.danger }]} numberOfLines={1} adjustsFontSizeToFit>{brl(Math.abs(S.bal))}</Text>
        <T muted small>{falta ? `Já conta ${brl(falta)} em contas que ainda vão ser pagas.` : S.out ? 'Todas as contas lançadas estão pagas.' : 'Comece anotando o que entra e o que sai.'}</T>
      </View>

      <View style={st.tiles}>
        <View style={st.tile}>
          <Row style={{ gap: 6 }}><Ionicons name="arrow-down-circle" size={18} color={C.ok} /><Text style={st.tileL}>Entrou no mês</Text></Row>
          <Text style={[st.tileV, { color: C.ok }]} numberOfLines={1} adjustsFontSizeToFit>{brl(S.inc)}</Text>
        </View>
        <View style={st.tile}>
          <Row style={{ gap: 6 }}><Ionicons name="arrow-up-circle" size={18} color={strong} /><Text style={st.tileL}>Saiu no mês</Text></Row>
          <Text style={st.tileV} numberOfLines={1} adjustsFontSizeToFit>{brl(saiu)}</Text>
        </View>
      </View>

      <Row style={{ gap: 10, marginBottom: 8 }}>
        <Btn title="Gasto" icon="add" onPress={() => setLanc('gasto')} color={strong} style={{ flex: 1, minHeight: 50 }} />
        <Btn kind="soft" title="Entrada" icon="add" onPress={() => setLanc('entrada')} color={C.ok} style={{ flex: 1, minHeight: 50 }} />
      </Row>
      <Btn kind="link" title="Importar extrato ou fatura do cartão" icon="document-text-outline" color={C.accent} onPress={() => router.push('/importar')} style={{ alignSelf: 'flex-start', marginBottom: 14 }} />

      {pend.length ? (
        <Card title="Contas a pagar" right={pend.length > 4 ? <Btn kind="link" title={todas ? 'ver menos' : `ver todas (${pend.length})`} color={C.accent} onPress={() => setTodas(!todas)} /> : undefined}>
          {(todas ? pend : pend.slice(0, 4)).map((x) => (
            <Row key={x.k} style={[st.line, { paddingVertical: 8, gap: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[ui.t, { fontFamily: F.bodyMed }]}>{x.t}</Text>
                <T muted small>{x.sub} · {brl(x.v)}</T>
              </View>
              <Btn kind="soft" title="Marcar paga" color={strong} style={{ minHeight: 38 }} onPress={() => { set(x.doc, x.path, true); success(); }} />
            </Row>
          ))}
        </Card>
      ) : null}

      {hist.length ? (
        <Card title="Últimos lançamentos">
          {hist.slice(0, 5).map((x, i) => (
            <Row key={i} style={[st.line, { paddingVertical: 6 }]}>
              <Ionicons name={x.tipo === 'entrada' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} size={18} color={x.tipo === 'entrada' ? C.ok : C.muted} />
              <View style={{ flex: 1 }}>
                <Text style={ui.t}>{x.t}</Text>
                <T muted small>{x.d.slice(8, 10)}/{x.d.slice(5, 7)}{x.tipo === 'gasto' && typeof x.c === 'number' ? ` · ${VARIA[x.c]}` : ''}</T>
              </View>
              <Text style={[ui.t, ui.num, x.tipo === 'entrada' && { color: C.ok }]}>{x.tipo === 'entrada' ? '+' : ''}{brl(num(x.v))}</Text>
            </Row>
          ))}
        </Card>
      ) : null}

      <Lancar tipo={lanc} dia={diaLanc} strong={strong} onClose={() => setLanc(null)} />

      <Fold id="fin-inc" title="Entradas" icon="arrow-down-circle-outline" color={C.ok} summary={brl(S.inc)}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Row key={i}>
            <Field doc={id} path={`inc.${i}.t`} placeholder={i === 0 ? 'Salário, freelas, vendas' : ''} />
            <Field doc={id} path={`inc.${i}.v`} placeholder="R$" keyboardType="decimal-pad" style={st.money} />
          </Row>
        ))}
        <Total label="Total" value={brl(S.inc)} strong />
      </Fold>

      <Fold id="fin-fix" title="Despesas fixas" icon="home-outline" color={strong} summary={brl(S.fix)} right={<T muted small>pago</T>}>
        {FIXAS.map((l, i) => (
          <Row key={l}>
            <Text style={st.lbl}>{l}</Text>
            <Field doc={id} path={`fix.${i}.v`} placeholder="R$" keyboardType="decimal-pad" style={st.money} />
            <DocCheck doc={id} path={`fix.${i}.ok`} color={strong} label={`${l} pago`} />
          </Row>
        ))}
        <Total label="Total" value={brl(S.fix)} strong />
      </Fold>

      <Fold id="fin-var" title="Despesas variáveis" icon="cart-outline" color={strong} summary={brl(S.va)}>
        {VARIA.map((l, i) => (
          <Row key={l}>
            <Text style={st.lbl}>{l}</Text>
            <Field doc={id} path={`var.${i}.v`} placeholder="R$" keyboardType="decimal-pad" style={st.money} />
          </Row>
        ))}
        <Total label="Total" value={brl(S.va)} strong />
      </Fold>

      <Parcelas id={id} d={d} strong={strong} />
      <Outras id={id} d={d} strong={strong} />
      <Espera strong={strong} />

      <Fold id="fin-meta" title="Meta de economia" icon="flag-outline" color={C.ok} summary={S.goal ? `quero juntar ${brl(S.goal)}` : "para que quer juntar?"}>
        <Field doc={id} path="goal.what" placeholder="Para que quero juntar" />
        <Row style={{ marginTop: 6 }}>
          <View style={{ flex: 1 }}><T muted small>quero juntar</T><Field doc={id} path="goal.v" placeholder="R$" keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><T muted small>guardar este mês</T><Field doc={id} path="goal.month" placeholder="R$" keyboardType="decimal-pad" /></View>
        </Row>
        {S.save ? <T muted small style={{ marginTop: 8 }}>{S.bal >= S.save ? 'O saldo do mês cobre o valor que você quer guardar.' : `Faltam ${brl(S.save - Math.max(S.bal, 0))} no saldo para guardar o valor do mês.`}</T> : null}
      </Fold>
    </Screen>
  );
}

/** Janela para lançar um gasto ou uma entrada com poucos toques. */
function Lancar({ tipo, dia, strong, onClose }: { tipo: 'gasto' | 'entrada' | null; dia: Date; strong: string; onClose: () => void }) {
  const [v, setV] = useState('');
  const [t, setT] = useState('');
  const [cat, setCat] = useState<number | null>(null);
  const valor = num(v);
  const c = cat ?? categoriaDe(t);
  function salvar() {
    if (!valor) return;
    if (tipo === 'gasto') addGasto(dia, valor, c, t);
    else addEntrada(dia, valor, t);
    success();
    setV(''); setT(''); setCat(null);
    onClose();
  }
  return (
    <Modal visible={!!tipo} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <View style={st.sheet}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={st.sheetH}>{tipo === 'gasto' ? 'Novo gasto' : 'Nova entrada'}</Text>
            <IconBtn icon="close" label="Fechar" onPress={onClose} />
          </Row>
          <TextInput value={v} onChangeText={setV} placeholder="R$ 0,00" placeholderTextColor={C.placeholder} keyboardType="decimal-pad" autoFocus
            style={[st.inp, { fontSize: 28, minHeight: 60, fontFamily: F.bodySemi }]} accessibilityLabel="Valor" onSubmitEditing={salvar} />
          <TextInput value={t} onChangeText={setT} placeholder={tipo === 'gasto' ? 'Com o quê? (ex.: mercado, uber)' : 'De onde? (ex.: salário, freela)'} placeholderTextColor={C.placeholder}
            style={st.inp} accessibilityLabel="Descrição" onSubmitEditing={salvar} />
          {tipo === 'gasto' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {VARIA.map((n, i) => {
                const on = c === i;
                return (
                  <Pressable key={n} onPress={() => setCat(i)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                    style={[st.chip, on && { backgroundColor: strong, borderColor: strong }]}>
                    <Text style={[st.chipT, on && { color: '#fff' }]}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <Btn title={valor ? `Salvar ${brl(valor)}` : 'Salvar'} icon="checkmark" onPress={salvar} disabled={!valor} color={tipo === 'gasto' ? strong : C.ok} style={{ minHeight: 50 }} />
          <T muted small style={{ textAlign: 'center' }}>Dica: no botão + de qualquer tela, escreva “gastei 32 no mercado”.</T>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Parcelas({ id, d, strong }: { id: string; d: Date; strong: string }) {
  const docs = useStore((s) => s.docs);
  const { push, remove } = useStore.getState();
  const ps = parcOf(docs, d);
  const all = parcList(docs);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ d: '', t: '', n: '', v: '', c: '' });
  const [msg, setMsg] = useState('');
  const upd = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  function add() {
    const n = Math.max(1, parseInt(form.n, 10) || 1);
    let val = num(form.v);
    const tot = num(form.t);
    if (!form.d.trim()) return setMsg('Escreva o que foi comprado.');
    if (!val && tot) val = tot / n;
    if (!val) return setMsg('Digite o valor total ou o valor de cada parcela.');
    push('t-parc', 'l', { id: uid('p'), d: form.d.trim(), v: toBR(val), n, start: mkey(d), c: form.c.trim(), total: tot ? toBR(tot) : '' });
    setForm({ d: '', t: '', n: '', v: '', c: '' });
    setMsg('');
    setOpen(false);
  }

  return (
    <Fold id="fin-parc" title="Parcelas" icon="card-outline" color={strong} summary={ps.length ? `${ps.length} neste mês · ${brl(ps.reduce((t, x) => t + num(x.v), 0))}` : "nenhuma neste mês"}>
      {!ps.length ? <T muted style={{ marginBottom: 8 }}>Nenhuma parcela neste mês.</T> : null}
      {ps.map((x) => {
        const pago = !!docs[id]?.pp?.[x.id];
        return (
          <Row key={x.id} style={st.line}>
            <DocCheck doc={id} path={`pp.${x.id}`} color={strong} label={`${x.d} paga`} />
            <View style={{ flex: 1, paddingVertical: 6 }}>
              <Text style={[ui.t, { fontFamily: F.bodyMed }, pago && st.done]}>{x.d || 'Parcela'}</Text>
              <T muted small>parcela {x.k} de {x.n}{x.c ? ` · ${x.c}` : ''} · última em {endLabel(x)}</T>
            </View>
            <Text style={[ui.t, ui.num, pago && st.done]}>{brl(num(x.v))}</Text>
          </Row>
        );
      })}
      {ps.length ? <Total label="Parcelas do mês" value={brl(ps.reduce((t, x) => t + num(x.v), 0))} strong /> : null}

      {open ? (
        <View style={st.form}>
          <TextInput style={st.inp} value={form.d} onChangeText={upd('d')} placeholder="O que foi comprado (ex.: geladeira)" placeholderTextColor={C.placeholder} />
          <Row>
            <TextInput style={[st.inp, { flex: 1 }]} value={form.t} onChangeText={upd('t')} placeholder="Valor total" keyboardType="decimal-pad" placeholderTextColor={C.placeholder} />
            <TextInput style={[st.inp, { flex: 1 }]} value={form.n} onChangeText={upd('n')} placeholder="Nº de parcelas" keyboardType="number-pad" placeholderTextColor={C.placeholder} />
          </Row>
          <TextInput style={st.inp} value={form.v} onChangeText={upd('v')} placeholder="ou o valor de cada parcela" keyboardType="decimal-pad" placeholderTextColor={C.placeholder} />
          <TextInput style={st.inp} value={form.c} onChangeText={upd('c')} placeholder="Cartão ou forma de pagamento (opcional)" placeholderTextColor={C.placeholder} />
          <T muted small>A primeira parcela entra neste mês.</T>
          {msg ? <Text style={{ fontFamily: F.body, color: C.danger }}>{msg}</Text> : null}
          <Row><Btn title="Lançar parcelas" onPress={add} color={strong} /><Btn kind="link" title="Cancelar" onPress={() => setOpen(false)} color={C.muted} /></Row>
        </View>
      ) : (
        <Btn kind="soft" title="+ Nova compra parcelada" onPress={() => setOpen(true)} style={{ marginTop: 10, alignSelf: 'flex-start' }} color={strong} />
      )}

      {all.length ? (
        <View style={{ marginTop: 14 }}>
          <T muted small style={{ marginBottom: 4 }}>Todas as compras parceladas ({all.length})</T>
          {all.map((x, i) => (
            <Row key={x.id} style={st.line}>
              <View style={{ flex: 1, paddingVertical: 4 }}>
                <Text style={[ui.t, { fontSize: 14 }]}>{x.d}</Text>
                <T muted small>{x.n}x de {brl(num(x.v))} · até {endLabel(x)}</T>
              </View>
              <IconBtn icon="close" label={`Apagar ${x.d}`} onPress={() => remove('t-parc', 'l', i)} />
            </Row>
          ))}
        </View>
      ) : null}
    </Fold>
  );
}

function Outras({ id, d, strong }: { id: string; d: Date; strong: string }) {
  const docs = useStore((s) => s.docs);
  const { push, remove } = useStore.getState();
  const l = oxList(docs, d);
  const tot = l.reduce((t, x) => t + num(x?.v), 0);
  return (
    <Fold id="fin-ox" title="Outras despesas" icon="receipt-outline" color={strong} summary={l.length ? `${l.length} · ${brl(tot)}` : "consulta, presente, conserto"}>
      {!l.length ? <T muted style={{ marginBottom: 8 }}>Gastos que não entram nas listas de cima: consulta, presente, conserto, viagem.</T> : null}
      {l.map((x, i) => (
        <View key={i} style={[st.line, { paddingVertical: 4 }]}>
          <Row>
            <DocCheck doc={id} path={`ox.${i}.ok`} color={strong} label="Paga" />
            <Field doc={id} path={`ox.${i}.t`} placeholder="Descrição" style={[{ borderBottomWidth: 0 }, x?.ok && st.done]} />
            <Field doc={id} path={`ox.${i}.v`} placeholder="R$" keyboardType="decimal-pad" style={[st.money, { borderBottomWidth: 0 }]} />
            <IconBtn icon="close" label="Apagar despesa" onPress={() => remove(id, 'ox', i)} />
          </Row>
          <Row style={{ paddingLeft: 32 }}>
            <Field doc={id} path={`ox.${i}.c`} placeholder="Categoria" style={{ borderBottomWidth: 0, fontSize: 13, minHeight: 30 }} />
            <Field doc={id} path={`ox.${i}.d`} placeholder="AAAA-MM-DD" style={{ borderBottomWidth: 0, fontSize: 13, minHeight: 30, flex: 0, width: 110 }} />
          </Row>
        </View>
      ))}
      <Total label="Total" value={brl(tot)} strong />
      <Btn kind="soft" title="+ Adicionar despesa" color={strong} style={{ marginTop: 10, alignSelf: 'flex-start' }}
        onPress={() => push(id, 'ox', { d: key(today()) <= key(new Date(d.getFullYear(), d.getMonth() + 1, 0)) && key(today()) >= key(d) ? key(today()) : key(d), t: '', c: '', v: '', ok: false })} />
    </Fold>
  );
}

type Wish = { id: string; t: string; v: string; at: string };

/**
 * "Esperar 24h": anota a vontade de comprar e decide no dia seguinte.
 * t-wish = { l: [{ id, t, v, at }], saved: total que deixou de gastar }.
 */
function Espera({ strong }: { strong: string }) {
  const raw = useStore((s) => s.docs['t-wish']);
  const { set, push, remove } = useStore.getState();
  const l: Wish[] = Array.isArray(raw?.l) ? raw.l.filter((x: Wish) => x && x.id) : [];
  const saved = num(raw?.saved);
  const [t, setT] = useState('');
  const [v, setV] = useState('');
  const [now] = useState(() => Date.now()); // hora em que a tela abriu

  function add() {
    if (!t.trim()) return;
    push('t-wish', 'l', { id: uid('w'), t: t.trim(), v: v.trim(), at: new Date().toISOString() });
    setT(''); setV('');
  }
  function comprei(i: number, x: Wish) {
    const hoje = today();
    push('f-' + mkey(hoje), 'ox', { d: key(hoje), t: x.t, c: 'Compras', v: x.v, ok: true });
    remove('t-wish', 'l', i);
  }
  function desisti(i: number, x: Wish) {
    set('t-wish', 'saved', toBR(saved + num(x.v)));
    remove('t-wish', 'l', i);
  }
  const ready = (x: Wish) => now - new Date(x.at).getTime() >= 864e5;
  const quando = (x: Wish) => {
    const d = new Date(new Date(x.at).getTime() + 864e5);
    return `decida a partir de amanhã, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const prontos = l.filter(ready).length;

  return (
    <Fold id="fin-espera" title="Esperar 24h" icon="hourglass-outline" color={strong}
      summary={prontos ? `${prontos} para decidir agora` : l.length ? `${l.length} esperando` : 'antes de comprar por impulso'}>
      <T muted style={{ marginBottom: 10, lineHeight: 20 }}>Deu vontade de comprar? Anote aqui e decida amanhã. Se ainda quiser, compre sem culpa.</T>
      {l.map((x, i) => (
        <View key={x.id} style={[st.line, { paddingVertical: 8 }]}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={[ui.t, { fontFamily: F.bodyMed }]}>{x.t}{x.v ? ` · ${brl(num(x.v))}` : ''}</Text>
              <T muted small>{ready(x) ? 'Já passaram 24 horas. Ainda quer?' : quando(x)}</T>
            </View>
            {!ready(x) ? <IconBtn icon="close" label="Apagar" onPress={() => remove('t-wish', 'l', i)} /> : null}
          </Row>
          {ready(x) ? (
            <Row style={{ gap: 8, marginTop: 8 }}>
              <Btn kind="soft" title="Comprei" icon="bag-check-outline" onPress={() => comprei(i, x)} color={C.ink} style={{ minHeight: 36 }} />
              <Btn kind="soft" title="Não quero mais" icon="leaf-outline" onPress={() => desisti(i, x)} color={C.ok} style={{ minHeight: 36 }} />
            </Row>
          ) : null}
        </View>
      ))}
      <View style={[st.form, { marginTop: 10 }]}>
        <TextInput style={st.inp} value={t} onChangeText={setT} placeholder="O que quero comprar" placeholderTextColor={C.placeholder} />
        <Row>
          <TextInput style={[st.inp, { flex: 1 }]} value={v} onChangeText={setV} placeholder="Quanto custa (opcional)" keyboardType="decimal-pad" placeholderTextColor={C.placeholder} />
          <Btn title="Esperar" onPress={add} color={strong} disabled={!t.trim()} />
        </Row>
      </View>
      {saved ? <T style={{ marginTop: 10, color: C.ok }}>Você já deixou de gastar {brl(saved)} esperando.</T> : null}
      <T muted small style={{ marginTop: 6 }}>Se comprar, o valor entra em Outras despesas deste mês.</T>
    </Fold>
  );
}

const st = StyleSheet.create({
  hero: { backgroundColor: C.surface, borderRadius: R.lg, padding: 20, marginBottom: 10, gap: 2 },
  heroL: { fontFamily: F.body, fontSize: 14, color: C.muted },
  heroV: { fontFamily: F.title, fontSize: 40, color: C.ink, fontVariant: ['tabular-nums'] },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(47,43,39,0.35)' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 28, gap: 12, width: '100%', maxWidth: 640, alignSelf: 'center' },
  sheetH: { fontFamily: F.title, fontSize: 24, color: C.ink },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center', backgroundColor: C.bg },
  chipT: { fontFamily: F.body, fontSize: 13, color: C.ink },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tile: { flexGrow: 1, flexBasis: '45%', backgroundColor: C.surface, borderRadius: R.md, padding: 14, gap: 4 },
  tileL: { fontFamily: F.body, fontSize: 12, color: C.muted },
  tileV: { fontFamily: F.bodySemi, fontSize: 20, color: C.ink, marginTop: 2, fontVariant: ['tabular-nums'] },
  track: { height: 10, backgroundColor: C.sand, borderRadius: 5, marginTop: 4, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  money: { flex: 0, width: 110, textAlign: 'right' },
  lbl: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.ink },
  line: { borderBottomWidth: 1, borderBottomColor: C.hair },
  done: { textDecorationLine: 'line-through', color: C.muted },
  form: { marginTop: 12, gap: 8, backgroundColor: C.bg, borderRadius: R.md, padding: 12 },
  inp: { fontFamily: F.body, fontSize: 15, color: C.ink, borderWidth: 1, borderColor: C.hair, borderRadius: R.sm, paddingHorizontal: 10, minHeight: 42, backgroundColor: C.surface },
});
