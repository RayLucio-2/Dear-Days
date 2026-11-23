import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '@/lib/store';
import { today } from '@/lib/dates';
import { brl, num } from '@/lib/money';
import { HAB_CORES, monthColor, uid } from '@/lib/planner';
import { Btn, Card, H1, IconBtn, Row, Screen, T } from '@/components/ui';
import { success } from '@/lib/actions';
import { C, F, R } from '@/lib/theme';

type Pausa = { id: string; n: string; desde: string; dia?: string; motivo?: string; recorde?: number; recomecos?: number; cor?: number };

const MARCOS = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365, 730];
const DIA = 864e5;
const fmtDur = (ms: number) => {
  const d = Math.floor(ms / DIA), h = Math.floor((ms % DIA) / 36e5);
  return d ? `${d} dia${d === 1 ? '' : 's'}${h ? ` e ${h}h` : ''}` : `${h}h`;
};
/** Data de início: agora menos N dias. */
const haDias = (n: number) => new Date(Date.now() - n * DIA).toISOString();

const SUGESTOES = ['Menos redes sociais', 'Compras por impulso', 'Doces', 'Refrigerante', 'Delivery', 'Roer as unhas'];

/** Acompanhar algo que você quer deixar de fazer. Recomeçar nunca apaga o caminho: o recorde fica guardado. */
export default function Parar() {
  const raw = useStore((s) => s.docs['t-parar']?.l);
  const { set, push, remove } = useStore.getState();
  const [, strong] = monthColor(today());
  const l: Pausa[] = Array.isArray(raw) ? raw.filter((x) => x && x.id) : [];
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 60000); return () => clearInterval(t); }, []);
  const [form, setForm] = useState({ n: '', ha: '', dia: '', motivo: '' });
  const [aberto, setAberto] = useState(false);

  function criar() {
    if (!form.n.trim()) return;
    const ha = Math.max(0, parseInt(form.ha, 10) || 0);
    push('t-parar', 'l', { id: uid('q'), n: form.n.trim(), desde: haDias(ha), dia: form.dia.trim(), motivo: form.motivo.trim(), recorde: 0, recomecos: 0, cor: l.length % HAB_CORES.length });
    setForm({ n: '', ha: '', dia: '', motivo: '' });
    setAberto(false);
    success();
  }

  return (
    <Screen>
      <H1 sub="Um dia de cada vez" color={strong}>Quero parar</H1>
      <T muted style={{ marginTop: -6, marginBottom: 16, lineHeight: 21 }}>
        Algo que você quer deixar de fazer ou fazer menos. Acompanhe os dias e o que economizou. Se escorregar, tudo bem: recomeçar faz parte, e o seu recorde fica guardado.
      </T>

      {l.map((p, i) => (
        <PausaCard key={p.id} p={p} agora={agora}
          onRecomecar={() => {
            const dur = agora - new Date(p.desde).getTime();
            set('t-parar', `l.${i}`, { ...p, desde: new Date().toISOString(), recorde: Math.max(p.recorde || 0, dur), recomecos: (p.recomecos || 0) + 1 });
          }}
          onApagar={() => remove('t-parar', 'l', i)} />
      ))}

      {aberto || !l.length ? (
        <Card title="Quero parar com algo">
          <TextInput value={form.n} onChangeText={(v) => setForm({ ...form, n: v })} placeholder="O quê? (ex.: menos redes sociais)" placeholderTextColor={C.placeholder} style={st.inp} accessibilityLabel="O que quer parar" />
          <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {SUGESTOES.map((s) => (
              <Btn key={s} kind="soft" title={s} color={C.ink} style={{ minHeight: 34 }} onPress={() => setForm({ ...form, n: s })} />
            ))}
          </Row>
          <Row style={{ gap: 8, marginTop: 10 }}>
            <TextInput value={form.ha} onChangeText={(v) => setForm({ ...form, ha: v })} placeholder="Já está há quantos dias? (0)" keyboardType="number-pad" placeholderTextColor={C.placeholder} style={[st.inp, { flex: 1 }]} accessibilityLabel="Dias sem" />
            <TextInput value={form.dia} onChangeText={(v) => setForm({ ...form, dia: v })} placeholder="Gastava R$ por dia" keyboardType="decimal-pad" placeholderTextColor={C.placeholder} style={[st.inp, { flex: 1 }]} accessibilityLabel="Gasto por dia" />
          </Row>
          <TextInput value={form.motivo} onChangeText={(v) => setForm({ ...form, motivo: v })} placeholder="Por que isso importa para você? (opcional)" placeholderTextColor={C.placeholder} style={[st.inp, { marginTop: 8 }]} accessibilityLabel="Motivo" />
          <Row style={{ gap: 12, marginTop: 12 }}>
            <Btn title="Começar" icon="checkmark" onPress={criar} disabled={!form.n.trim()} color={strong} />
            {l.length ? <Btn kind="link" title="Cancelar" color={C.muted} onPress={() => setAberto(false)} /> : null}
          </Row>
        </Card>
      ) : (
        <Btn kind="soft" title="+ Quero parar com outra coisa" color={strong} onPress={() => setAberto(true)} style={{ alignSelf: 'flex-start' }} />
      )}

      <T muted small style={{ marginTop: 18, lineHeight: 19 }}>
        Isto é só um registro pessoal. Se for algo que está pesando muito, conversar com alguém de confiança ou com um profissional de saúde ajuda bastante.
      </T>
    </Screen>
  );
}

function PausaCard({ p, agora, onRecomecar, onApagar }: { p: Pausa; agora: number; onRecomecar: () => void; onApagar: () => void }) {
  const [confirma, setConfirma] = useState<'' | 'recomecar' | 'apagar'>('');
  const [fundo, vazia, forte] = HAB_CORES[(p.cor || 0) % HAB_CORES.length].c;
  const dur = Math.max(0, agora - new Date(p.desde).getTime());
  const dias = dur / DIA;
  const prox = MARCOS.find((m) => m > dias) ?? Math.ceil(dias / 365 + 1) * 365;
  const ant = [...MARCOS].reverse().find((m) => m <= dias) ?? 0;
  const pc = Math.min(1, (dias - ant) / (prox - ant || 1));
  const eco = num(p.dia) * dias;
  const recorde = Math.max(p.recorde || 0, dur);
  const R0 = 40, CIRC = 2 * Math.PI * R0;

  return (
    <View style={[st.card, { backgroundColor: fundo }]}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={st.nome} numberOfLines={2}>{p.n}</Text>
        <IconBtn icon="close" label={`Apagar ${p.n}`} size={18} onPress={() => setConfirma('apagar')} />
      </Row>
      <Row style={{ gap: 16 }}>
        <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={96} height={96} style={{ position: 'absolute' }}>
            <Circle cx={48} cy={48} r={R0} stroke={vazia} strokeWidth={8} fill="none" />
            <Circle cx={48} cy={48} r={R0} stroke={forte} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${CIRC * pc} ${CIRC}`} transform="rotate(-90 48 48)" />
          </Svg>
          <Text style={st.ringN}>{Math.floor(dias)}</Text>
          <Text style={st.ringL}>dia{Math.floor(dias) === 1 ? '' : 's'}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={st.livre}>Livre há {fmtDur(dur)}</Text>
          <T muted small>Próximo marco: {prox} dias ({Math.round(pc * 100)}%)</T>
          {p.motivo ? <Text style={st.motivo}>“{p.motivo}”</Text> : null}
        </View>
      </Row>
      <Row style={{ gap: 8, marginTop: 14 }}>
        {num(p.dia) ? <View style={st.tile}><Text style={st.tileL}>Economizado</Text><Text style={[st.tileV, { color: C.ok }]}>{brl(eco)}</Text></View> : null}
        <View style={st.tile}><Text style={st.tileL}>Melhor sequência</Text><Text style={st.tileV}>{fmtDur(recorde)}</Text></View>
      </Row>
      {confirma === 'recomecar' ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <T style={{ lineHeight: 20 }}>Tudo bem. Recomeçar também é coragem. O contador volta a zero e o seu recorde fica guardado.</T>
          <Row style={{ gap: 12 }}>
            <Btn title="Recomeçar agora" color={forte} onPress={() => { onRecomecar(); setConfirma(''); }} />
            <Btn kind="link" title="Voltar" color={C.muted} onPress={() => setConfirma('')} />
          </Row>
        </View>
      ) : confirma === 'apagar' ? (
        <Row style={{ gap: 12, marginTop: 12 }}>
          <T style={{ flex: 1 }}>Apagar este acompanhamento?</T>
          <Btn kind="link" title="Apagar" color={C.danger} onPress={onApagar} />
          <Btn kind="link" title="Voltar" color={C.muted} onPress={() => setConfirma('')} />
        </Row>
      ) : (
        <Btn kind="link" title="Escorreguei, quero recomeçar" color={C.muted} onPress={() => setConfirma('recomecar')} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
      )}
      {p.recomecos ? <T muted small style={{ marginTop: 4 }}>Você já recomeçou {p.recomecos} vez{p.recomecos === 1 ? '' : 'es'}. Cada recomeço conta.</T> : null}
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: R.lg, padding: 18, marginBottom: 12 },
  nome: { flex: 1, fontFamily: F.title, fontSize: 24, color: C.ink },
  ringN: { fontFamily: F.title, fontSize: 30, color: C.ink, lineHeight: 32 },
  ringL: { fontFamily: F.body, fontSize: 11, color: C.muted },
  livre: { fontFamily: F.bodyMed, fontSize: 16, color: C.ink },
  motivo: { fontFamily: F.titleItalic, fontSize: 17, color: C.ink, marginTop: 4 },
  tile: { flex: 1, backgroundColor: C.glass, borderRadius: R.md, padding: 12, gap: 2 },
  tileL: { fontFamily: F.body, fontSize: 12, color: C.muted },
  tileV: { fontFamily: F.bodySemi, fontSize: 18, color: C.ink },
  inp: { fontFamily: F.body, fontSize: 15, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 12, minHeight: 44, backgroundColor: C.surface },
});
