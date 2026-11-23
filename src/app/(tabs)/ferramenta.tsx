import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { addMonths, fromKey, key, MESES, mkey, today } from '@/lib/dates';
import { COR, MOODC, MOODN, MOODT, monthColor } from '@/lib/planner';
import { AREAS, promptOf, semestres, toolOf } from '@/lib/tools';
import { useWide } from '@/lib/layout';
import { Btn, Card, Field, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { Radar } from '@/components/charts';
import { C, F, R, soft } from '@/lib/theme';

/**
 * Todas as ferramentas do planner web, com os mesmos docs:
 * t-pref, t-pil, y-AAAA (roda), t-m5, t-plano, t-sent, t-hob, t-son, t-lei, t-mem, t-ref, t-carta, t-notas, t-esc.
 */
export default function Ferramenta() {
  const { k } = useLocalSearchParams<{ k: string }>();
  const tool = toolOf(String(k));
  const [, strong] = monthColor(today());
  if (!tool) return <Screen><T>Ferramenta não encontrada.</T></Screen>;
  const Body = BODY[tool.k];
  return (
    <Screen>
      <Btn kind="link" icon="chevron-back" title="Ferramentas" color={C.accent} onPress={() => router.navigate('/mais')} style={{ alignSelf: 'flex-start' }} />
      <Text style={[ui.eyebrow, { color: strong, marginTop: 4 }]}>Ferramenta</Text>
      <Text style={ui.h1}>{tool.n}</Text>
      <T muted style={{ marginTop: 4, marginBottom: 14, lineHeight: 21 }}>{tool.sub}</T>
      <Body strong={strong} />
    </Screen>
  );
}

type P = { strong: string };
const Cols = ({ children }: { children: React.ReactNode }) => {
  const wide = useWide();
  return <View style={wide ? st.cols : null}>{children}</View>;
};
const Half = ({ title, children }: { title?: string; children: React.ReactNode }) => {
  const wide = useWide();
  return <Card title={title} style={wide ? { width: '49%' } : undefined}>{children}</Card>;
};
const useList = (id: string, path = 'l') => {
  const raw = useStore((s) => s.docs[id]?.[path]);
  return Array.isArray(raw) ? raw : [];
};

function Prefacio() {
  const id = 't-pref';
  return (
    <Cols>
      <Half title="Como usar">
        <T style={st.p}>Use a página do <Text style={st.b}>Dia</Text> todos os dias, mesmo que por dois minutos: prioridades, tarefas, emoção e água.</T>
        <T style={st.p}>No começo de cada mês, abra o <Text style={st.b}>Mês</Text> e escolha três metas. Na <Text style={st.b}>Semana</Text>, anote compromissos.</T>
        <T style={st.p}>As <Text style={st.b}>Ferramentas</Text> são para momentos com mais calma: pilares, roda da vida, sonhos e reflexões.</T>
        <T style={st.p}>Pulou alguns dias? Recomece em hoje. Nada aqui precisa ficar completo.</T>
      </Half>
      <Half title="Minha intenção com este planner"><Field doc={id} path="intent" multiline placeholder="Por que estou começando agora?" /></Half>
      <Half title="Como quero me sentir usando"><Field doc={id} path="feel" multiline placeholder="Leve, no controle, com mais calma…" /></Half>
    </Cols>
  );
}

function Pilares() {
  const id = 't-pil';
  return (
    <Cols>
      {[0, 1, 2, 3, 4].map((i) => (
        <Half key={i} title={`Pilar ${i + 1}`}>
          <Field doc={id} path={`p.${i}.n`} placeholder="Nome do pilar (ex.: saúde, família, liberdade)" />
          <Field doc={id} path={`p.${i}.s`} multiline placeholder="O que isso significa para mim" style={{ marginTop: 8 }} />
          <Field doc={id} path={`p.${i}.v`} placeholder="Como vou viver isso no dia a dia" />
        </Half>
      ))}
    </Cols>
  );
}

function Roda({ strong }: P) {
  const y = today().getFullYear(), id = 'y-' + y;
  const doc = useStore((s) => s.docs[id]);
  const set = useStore((s) => s.set);
  const vals = AREAS.map((_, i) => Math.max(0, Math.min(10, Number(doc?.area?.[i]?.nota) || 0)));
  return (
    <Cols>
      <Half title={`Sua roda em ${y}`}><Radar labels={AREAS} values={vals} color={strong} /></Half>
      <Half title="Notas">
        {AREAS.map((a, i) => (
          <View key={a} style={{ marginBottom: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}><T>{a}</T><Text style={[st.b, { color: strong }]}>{vals[i]}</Text></Row>
            <View style={st.scale}>
              {Array.from({ length: 11 }, (_, n) => (
                <Pressable key={n} onPress={() => set(id, `area.${i}.nota`, String(n))} accessibilityLabel={`${a}: ${n}`} accessibilityState={{ selected: vals[i] === n }}
                  style={[st.sc, n <= vals[i] && n > 0 && { backgroundColor: strong }, vals[i] === n && { borderColor: C.ink }]}>
                  <Text style={[st.scT, n <= vals[i] && n > 0 && { color: '#fff' }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <T muted small>As mesmas notas aparecem no Plano do ano.</T>
      </Half>
    </Cols>
  );
}

function Metas5() {
  const id = 't-m5', y = today().getFullYear() + 5;
  return (
    <Cols>
      {AREAS.map((a, i) => (
        <Half key={a} title={a}>
          <Field doc={id} path={`a.${i}.w`} multiline placeholder={`Em ${y}, quero…`} />
          <Field doc={id} path={`a.${i}.s`} placeholder="Um passo que posso dar este ano" />
        </Half>
      ))}
    </Cols>
  );
}

function Plano({ strong }: P) {
  const id = 't-plano';
  return (
    <Cols>
      <Half title="3 prioridades de vida">
        {[0, 1, 2].map((i) => <Row key={i}><Text style={[st.n, { color: strong }]}>{i + 1}</Text><Field doc={id} path={`p.${i}`} placeholder={`Prioridade ${i + 1}`} /></Row>)}
      </Half>
      <Half title="O que essas três intenções revelam sobre a vida que desejo construir?">
        <Field doc={id} path="ref" multiline placeholder="Escreva com calma" style={{ minHeight: 160 }} />
      </Half>
      <Btn kind="link" title="Transformar um sentimento em atitude: Do sentir à ação" color={C.accent} onPress={() => router.setParams({ k: 'sentir' })} />
    </Cols>
  );
}

function Sentir() {
  const id = 't-sent';
  const l = useList(id);
  const { set, push, remove } = useStore.getState();
  return (
    <>
      <Btn title="Novo registro" icon="add" onPress={() => push(id, 'l', { d: new Date().toLocaleDateString('pt-BR') })} style={{ alignSelf: 'flex-start', marginBottom: 12 }} />
      <Cols>
        {l.map((r: any, i: number) => ({ r, i })).reverse().map(({ r, i }) => (
          <Half key={i}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={st.b}>{r?.d || ''}</Text>
              <IconBtn icon="close" label="Apagar" onPress={() => remove(id, 'l', i)} />
            </Row>
            <View style={st.chips}>
              {MOODN.map((nm, j) => {
                const on = r?.e === j + 1;
                return (
                  <Pressable key={nm} onPress={() => set(id, `l.${i}.e`, on ? 0 : j + 1)} style={[st.chip, on && { backgroundColor: MOODC[j] }]} accessibilityState={{ selected: on }}>
                    <View style={[st.dot, { backgroundColor: MOODC[j] }]} />
                    <Text style={[st.chipT, on && { color: MOODT[j] }]}>{nm}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field doc={id} path={`l.${i}.s`} multiline placeholder="O que estou sentindo e por quê" style={{ marginTop: 8 }} />
            <Field doc={id} path={`l.${i}.p`} placeholder="O que esse sentimento me pede" />
            <Field doc={id} path={`l.${i}.a`} placeholder="Uma ação pequena que vou fazer" />
          </Half>
        ))}
      </Cols>
    </>
  );
}

function Hobbies() {
  const id = 't-hob';
  const l = useList(id);
  const { push, remove } = useStore.getState();
  return (
    <>
      <Card title="Meus hobbies">
        {!l.length ? <T muted style={{ marginBottom: 10 }}>Nenhum hobby anotado ainda.</T> : null}
        {l.map((_: any, i: number) => (
          <Row key={i} style={{ flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: C.hair }}>
            <Field doc={id} path={`l.${i}.n`} placeholder="Hobby" style={{ flexBasis: 160, borderBottomWidth: 0 }} />
            <Field doc={id} path={`l.${i}.f`} placeholder="Com que frequência" style={{ flexBasis: 120, borderBottomWidth: 0 }} />
            <Field doc={id} path={`l.${i}.u`} placeholder="Última vez (AAAA-MM-DD)" style={{ flexBasis: 150, borderBottomWidth: 0 }} />
            <IconBtn icon="close" label="Apagar hobby" onPress={() => remove(id, 'l', i)} />
          </Row>
        ))}
        <Btn kind="soft" title="Adicionar hobby" icon="add" onPress={() => push(id, 'l', { n: '', f: '', u: '' })} style={{ alignSelf: 'flex-start', marginTop: 10 }} />
      </Card>
      <Card title="Hobbies que quero experimentar"><Field doc={id} path="novo" multiline placeholder="Pintura, dança, cerâmica…" /></Card>
    </>
  );
}

function Sonhos() {
  const id = 't-son';
  return (
    <Cols>
      {[1, 2, 3].map((i) => (
        <Half key={i} title={`Sonho ${i}`}>
          <Field doc={id} path={`s.${i}.n`} placeholder="Meu sonho" />
          <Field doc={id} path={`s.${i}.w`} multiline placeholder="Por que isso importa para mim" style={{ marginTop: 8 }} />
          <Field doc={id} path={`s.${i}.p`} placeholder="Primeiro passo" />
          <Field doc={id} path={`s.${i}.d`} placeholder="Até quando" />
        </Half>
      ))}
    </Cols>
  );
}

function Stars({ n, onPick, color }: { n: number; onPick?: (v: number) => void; color: string }) {
  return (
    <Row style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Pressable key={v} onPress={() => onPick?.(n === v ? 0 : v)} disabled={!onPick} hitSlop={4} accessibilityLabel={`${v} estrela${v > 1 ? 's' : ''}`}>
          <Ionicons name={v <= n ? 'star' : 'star-outline'} size={22} color={color} />
        </Pressable>
      ))}
    </Row>
  );
}

function Leituras({ strong }: P) {
  const id = 't-lei';
  const l = useList(id);
  const { set, push, remove } = useStore.getState();
  const [f, setF] = useState({ t: '', a: '', i: '', s: '', e: '', c: '' });
  const [r, setR] = useState(0);
  const [msg, setMsg] = useState('');
  const wide = useWide();
  const fmt = (x: string) => (x ? x.split('-').reverse().join('/') : '');
  const inp = (k: keyof typeof f, ph: string, multi = false) => (
    <TextInput value={f[k]} onChangeText={(v) => setF({ ...f, [k]: v })} placeholder={ph} placeholderTextColor={C.placeholder} multiline={multi} style={[st.inp, multi && { minHeight: 80, textAlignVertical: 'top' }]} accessibilityLabel={ph} />
  );
  return (
    <Cols>
      <Half title="Nova leitura">
        <View style={{ gap: 8 }}>
          {inp('t', 'Título')}{inp('a', 'Autor(a)')}{inp('i', 'Importância (ex.: alta, média)')}
          <Row>{inp('s', 'Início (AAAA-MM-DD)')}{inp('e', 'Término (AAAA-MM-DD)')}</Row>
          <Row><T muted small>Avaliação</T><Stars n={r} onPick={setR} color={strong} /></Row>
          {inp('c', 'Comentários do livro', true)}
          <Row>
            <Btn title="Salvar leitura" color={strong} onPress={() => {
              if (!f.t.trim()) return setMsg('Digite o título para salvar.');
              push(id, 'l', { ...f, t: f.t.trim(), r });
              setF({ t: '', a: '', i: '', s: '', e: '', c: '' }); setR(0); setMsg('Leitura salva.');
            }} />
            {msg ? <T muted small>{msg}</T> : null}
          </Row>
        </View>
      </Half>
      <View style={wide ? { width: '49%' } : undefined}>
        {!l.length ? <Card title="Suas leituras"><T muted>As leituras salvas aparecem aqui.</T></Card> : null}
        {l.map((b: any, i: number) => ({ b, i })).reverse().map(({ b, i }) => (
          <Card key={i}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={st.bookT}>{b?.t || 'Sem título'}</Text>
                <T muted small>{b?.a || ''}{b?.i ? ` · importância ${b.i}` : ''}{b?.s || b?.e ? ` · ${fmt(b.s)}${b.e ? ' a ' + fmt(b.e) : ''}` : ''}</T>
              </View>
              <IconBtn icon="close" label="Apagar leitura" onPress={() => remove(id, 'l', i)} />
            </Row>
            <View style={{ marginVertical: 6 }}><Stars n={Number(b?.r || 0)} onPick={(v) => set(id, `l.${i}.r`, v)} color={strong} /></View>
            <Field doc={id} path={`l.${i}.c`} multiline placeholder="Comentários" />
          </Card>
        ))}
      </View>
    </Cols>
  );
}

function Memorias() {
  const id = 't-mem';
  // do mês de início do planner (nov/2026) até o fim do ano que vem
  const months: Date[] = [];
  for (let d = new Date(2026, 10, 1); d <= new Date(Math.max(2027, today().getFullYear() + 1), 11, 1); d = addMonths(d, 1)) months.push(d);
  return (
    <Cols>
      {months.map((d) => (
        <Half key={mkey(d)} title={`${MESES[d.getMonth()]} ${d.getFullYear()}`}>
          <View style={[st.bar, { backgroundColor: soft(COR[d.getMonth()][0]) }]} />
          <Field doc={id} path={mkey(d)} multiline placeholder="Momentos, pessoas, conquistas" />
        </Half>
      ))}
    </Cols>
  );
}

function Reflexao() {
  const id = 't-ref';
  const wide = useWide();
  const Q: [string, string][] = [['c', 'O que consegui'], ['d', 'O que foi difícil'], ['a', 'O que aprendi sobre mim'], ['l', 'O que levo para o próximo semestre']];
  return (
    <>
      {semestres().map(([k, t]) => (
        <Card key={k} title={t}>
          <Cols>
            {Q.map(([q, l]) => (
              <View key={q} style={[{ marginBottom: 10 }, wide ? { width: '49%' } : null]}>
                <T muted small>{l}</T>
                <Field doc={id} path={`${k}.${q}`} multiline />
              </View>
            ))}
          </Cols>
        </Card>
      ))}
    </>
  );
}

function Carta({ strong }: P) {
  const id = 't-carta';
  const at = useStore((s) => s.docs[id]?.at);
  const set = useStore((s) => s.set);
  return (
    <Card>
      <Field doc={id} path="t" multiline placeholder="Querida eu do futuro," style={{ minHeight: 320, fontFamily: F.title, fontSize: 19, lineHeight: 28 }} />
      <Row style={{ marginTop: 12 }}>
        <Btn title="Salvar carta" color={strong} onPress={() => set(id, 'at', new Date().toLocaleDateString('pt-BR'))} />
        {at ? <T muted small>Salva em {at}</T> : null}
      </Row>
    </Card>
  );
}

function Notas({ strong }: P) {
  const id = 't-notas';
  const l = useList(id);
  const { push, remove } = useStore.getState();
  const [txt, setTxt] = useState('');
  return (
    <>
      <Card title="Nova nota">
        <TextInput value={txt} onChangeText={setTxt} multiline placeholder="Escreva aqui" placeholderTextColor={C.placeholder} style={[st.inp, { minHeight: 80, textAlignVertical: 'top' }]} />
        <Btn title="Adicionar nota" color={strong} style={{ alignSelf: 'flex-start', marginTop: 10 }}
          onPress={() => { if (!txt.trim()) return; push(id, 'l', { d: new Date().toLocaleDateString('pt-BR'), t: txt.trim() }); setTxt(''); }} />
      </Card>
      <Cols>
        {l.map((n: any, i: number) => ({ n, i })).reverse().map(({ n, i }) => (
          <Half key={i}>
            <Row style={{ justifyContent: 'space-between' }}><T muted small>{n?.d || ''}</T><IconBtn icon="close" label="Apagar nota" onPress={() => remove(id, 'l', i)} /></Row>
            <Field doc={id} path={`l.${i}.t`} multiline />
          </Half>
        ))}
      </Cols>
    </>
  );
}

function Escrita({ strong }: P) {
  const id = 't-esc';
  const e = useStore((s) => s.docs[id]?.e) || {};
  const k = key(today());
  const past = Object.keys(e).filter((x) => x !== k && e[x]?.t).sort().reverse();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Cols>
      <Half title="Convite de hoje">
        <Text style={[st.prompt, { color: strong }]}>{promptOf(today())}</Text>
        <Field doc={id} path={`e.${k}.t`} multiline placeholder="Escreva livremente" style={{ minHeight: 220 }} />
      </Half>
      <Half title="Escritas anteriores">
        {!past.length ? <T muted>O que você escrever nos próximos dias fica guardado aqui.</T> : past.map((x) => {
          const dd = fromKey(x);
          return (
            <View key={x} style={{ borderBottomWidth: 1, borderBottomColor: C.hair, paddingVertical: 8 }}>
              <Pressable onPress={() => setOpen(open === x ? null : x)} accessibilityRole="button" accessibilityState={{ expanded: open === x }}>
                <Text style={st.b}>{dd.getDate()} de {MESES[dd.getMonth()].toLowerCase()} <Text style={{ fontFamily: F.body, color: C.muted }}>· {promptOf(dd)}</Text></Text>
              </Pressable>
              {open === x ? <T style={{ marginTop: 6, lineHeight: 21 }}>{e[x].t}</T> : null}
            </View>
          );
        })}
      </Half>
    </Cols>
  );
}

const BODY: Record<string, (p: P) => React.ReactElement> = {
  prefacio: Prefacio, pilares: Pilares, roda: Roda, metas5: Metas5, plano: Plano, sentir: Sentir, hobbies: Hobbies,
  sonhos: Sonhos, leituras: Leituras, memorias: Memorias, reflexao: Reflexao, carta: Carta, notas: Notas, escrita: Escrita,
};

const st = StyleSheet.create({
  cols: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  p: { marginBottom: 8, lineHeight: 21 },
  b: { fontFamily: F.bodySemi },
  n: { fontFamily: F.title, fontSize: 20, width: 16 },
  scale: { flexDirection: 'row', gap: 3, marginTop: 4 },
  sc: { flex: 1, minHeight: 30, borderRadius: 8, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  scT: { fontFamily: F.bodyMed, fontSize: 12, color: C.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.sand, borderRadius: 999, paddingHorizontal: 10, minHeight: 32 },
  chipT: { fontFamily: F.body, fontSize: 13, color: C.ink },
  dot: { width: 10, height: 10, borderRadius: 5 },
  inp: { flex: 1, minWidth: 0, fontFamily: F.body, fontSize: 15, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 10, minHeight: 42, backgroundColor: C.bg },
  bookT: { fontFamily: F.title, fontSize: 20, color: C.ink },
  bar: { height: 5, width: 44, borderRadius: 3, marginBottom: 8 },
  prompt: { fontFamily: F.titleItalic, fontSize: 22, lineHeight: 28, marginBottom: 10 },
});
