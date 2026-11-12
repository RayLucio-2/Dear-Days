import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { DIASL, holiday, key, MESES, minutes, mkey, sunday, today } from '@/lib/dates';
import { brl } from '@/lib/money';
import { CATSTRONG, MOODC, MOODN, Task, dayInfo, finSums, habits, monthColor, rulesFor } from '@/lib/planner';
import { Card, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { Face } from '@/components/art';
import { C, F, R } from '@/lib/theme';
import { DEF_FAV, DEF_HOME, FAV_VIEWS, hrefOf, listOf } from '@/lib/prefs';
import { TOOLS } from '@/lib/tools';
import { useAcesso } from '@/lib/assinatura';

const FCOL = ['#E7DCCF', '#E5D5D3', '#DDE3D3', '#DCE0E8', '#EADFC9', '#E2D8E6'];

/** Cartões grandes escolhidos em Personalizar > Atalhos. */
function Atalhos({ strong, soft }: { strong: string; soft: string }) {
  const cfg = useStore((s) => s.docs['t-cfg']);
  const fv = listOf(cfg, 'fav', DEF_FAV).map((v) => FAV_VIEWS.find((f) => f[0] === v)).filter(Boolean) as [string, string, string][];
  if (!fv.length) return null;
  return (
    <View style={st.fav}>
      {fv.map(([v, n, d], i) => (
        <Pressable key={v} onPress={() => { if (v === 'dia') useStore.getState().setCur(key(today())); router.navigate(hrefOf(v)); }} accessibilityRole="button"
          style={({ pressed }) => [st.favC, { backgroundColor: i === 0 ? soft : FCOL[(i - 1) % FCOL.length] }, pressed && { opacity: 0.75 }]}>
          <Text style={st.favN}>{n}</Text>
          <Text style={st.favD} numberOfLines={2}>{d}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Emoção mais frequente do mês. */
function EmocoesMes() {
  const docs = useStore((s) => s.docs);
  const t = today();
  const pre = 'd-' + mkey(t) + '-';
  const c = MOODN.map(() => 0);
  Object.entries(docs).forEach(([id, d]) => { if (id.startsWith(pre) && d?.mood) c[Number(d.mood) - 1]++; });
  const tot = c.reduce((a, b) => a + b, 0);
  let top = -1;
  c.forEach((v, i) => { if (v && (top < 0 || v > c[top])) top = i; });
  return (
    <Card title="Emoções do mês" right={<Link onPress={() => router.navigate('/emocoes')} />}>
      {top < 0 ? <T muted>Marque a emoção na página de cada dia.</T> : (
        <>
          <Row style={{ marginBottom: 10 }}>
            <Face i={top} size={40} />
            <T style={{ flex: 1 }}><Text style={{ fontFamily: F.bodySemi }}>{MOODN[top]}</Text> apareceu em {c[top]} de {tot} dias marcados.</T>
          </Row>
          <View style={st.moodBar}>{c.map((v, i) => (v ? <View key={i} style={{ flex: v, backgroundColor: MOODC[i] }} /> : null))}</View>
        </>
      )}
    </Card>
  );
}

const STATUS: Record<string, string> = { salvo: 'sincronizado', salvando: 'salvando...', erro: 'sem conexão, vou tentar de novo', offline: 'offline', local: 'só neste aparelho' };

export default function Inicio() {
  const docs = useStore((s) => s.docs);
  const status = useStore((s) => s.status);
  const setCur = useStore((s) => s.setCur);
  const email = useAuth((a) => a.email);
  const t = today();
  const tk = key(t);
  const [soft, strong] = monthColor(t);
  const doc = docs['d-' + tk] || {};
  const info = dayInfo(docs, t);
  const hs = habits(docs);
  const mid = 'm-' + mkey(t);
  const hDone = hs.filter((h) => docs[mid]?.hk?.[h.id]?.[t.getDate()]).length;
  const fin = finSums(docs, t);
  const metas = [0, 1, 2].map((i) => docs[mid]?.metas?.[i]).filter((x: any) => x?.t);
  const h = t.getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const fer = holiday(t);

  const next = [
    ...(Array.isArray(doc.tl) ? doc.tl : []).filter((x: Task) => x?.t && !x.ok).map((x: Task) => ({ t: x.t!, time: x.time || '' })),
    ...rulesFor(docs, t).filter((r) => !doc.rd?.[r.id] && !doc.rs?.[r.id]).map((r) => ({ t: r.t, time: r.time || '' })),
  ].sort((a, b) => (a.time || '99').localeCompare(b.time || '99')).slice(0, 4);

  const open = (path: '/dia' | '/habitos' | '/mes' | '/financas') => { setCur(tk); router.navigate(path); };

  // contagem até a próxima tarefa com horário (atualiza a cada 30 s)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(i); }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const upcoming = next.map((x) => ({ ...x, m: minutes(x.time) })).filter((x) => x.m != null && x.m >= nowMin - 5).sort((a, b) => a.m! - b.m!)[0];
  const until = upcoming ? upcoming.m! - nowMin : null;
  const untilTxt = until == null ? '' : until <= 0 ? 'agora' : until < 60 ? `em ${until} min` : `em ${Math.floor(until / 60)}h${until % 60 ? String(until % 60).padStart(2, '0') : ''}`;

  const inboxRaw = docs['t-inbox']?.l;
  const inboxN = Array.isArray(inboxRaw) ? inboxRaw.length : 0;
  const wid = 'w-' + key(sunday(t));
  const revFeita = !!docs[wid]?.rev?.feita;
  const showRev = !revFeita && (t.getDay() === 0 || t.getDay() >= 5); // sexta, sábado e domingo
  const gentle = info.total && !info.done && h >= 14 ? 'Tudo bem, recomeça agora: escolha só uma coisa.' : '';

  const B: Record<string, () => React.ReactNode> = {
    hoje: () => (<>
      <Pressable onPress={() => open('/dia')} style={[st.hero, { backgroundColor: soft }]} accessibilityRole="button" accessibilityLabel="Abrir o dia de hoje">
        <View style={{ flex: 1 }}>
          <Text style={st.heroN}>{info.done}<Text style={st.heroOf}>/{info.total}</Text></Text>
          <Text style={st.heroL}>{info.total ? 'tarefas e prioridades feitas hoje' : 'nada planejado ainda para hoje'}</Text>
        </View>
        {info.mood ? <View style={{ alignItems: 'center' }}><Face i={info.mood - 1} size={44} /><T small muted>{MOODN[info.mood - 1]}</T></View> : <Ionicons name="arrow-forward" size={22} color={strong} />}
      </Pressable>

      {upcoming ? (
        <Pressable onPress={() => open('/dia')} style={[st.countdown, { borderColor: strong }]} accessibilityRole="button">
          <Ionicons name="time-outline" size={22} color={strong} />
          <Text style={st.cdT} numberOfLines={2}><Text style={{ fontFamily: F.bodySemi }}>{upcoming.t}</Text> {untilTxt}</Text>
          <Text style={[st.cdH, { color: strong }]}>{upcoming.time}</Text>
        </Pressable>
      ) : null}
      {gentle ? <T muted style={{ textAlign: 'center', marginBottom: 12 }}>{gentle}</T> : null}

      </>),
    caixa: () => (<>
      {inboxN || showRev ? (
        <View style={st.two}>
          {inboxN ? (
            <Pressable style={[st.mini, { flex: 1 }]} onPress={() => router.push('/caixa')} accessibilityRole="button">
              <Ionicons name="file-tray-outline" size={18} color={strong} />
              <Text style={st.miniV}>{inboxN}</Text>
              <Text style={st.miniL}>na caixa de entrada</Text>
            </Pressable>
          ) : null}
          {showRev ? (
            <Pressable style={[st.mini, { flex: 1, backgroundColor: soft, borderColor: soft }]} onPress={() => router.push('/revisao')} accessibilityRole="button">
              <Ionicons name="refresh-outline" size={18} color={strong} />
              <Text style={[st.miniV, { fontSize: 20 }]}>Revisão</Text>
              <Text style={st.miniL}>da semana, 5 min</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!showRev ? <Pressable onPress={() => router.push('/revisao')} style={{ alignSelf: 'center', padding: 8 }} accessibilityRole="link"><Text style={{ fontFamily: F.bodyMed, fontSize: 13, color: C.accent }}>Fazer a revisão da semana</Text></Pressable> : null}
      </>),
    tarefas: () => (<>
      <Card title="Próximas tarefas" right={<Link onPress={() => open('/dia')} />}>
        {next.length ? next.map((x, i) => (
          <Row key={i} style={st.line}>
            <Text style={st.time}>{x.time || '··'}</Text>
            <Text style={[ui.t, { flex: 1 }]} numberOfLines={1}>{x.t}</Text>
          </Row>
        )) : <T muted>Tudo feito por aqui.</T>}
      </Card>

      </>),
    habitos: () => (<>
      <View style={st.two}>
        <Pressable style={[st.mini, { flex: 1 }]} onPress={() => open('/habitos')} accessibilityRole="button">
          <Text style={st.miniL}>Hábitos hoje</Text>
          <Text style={st.miniV}>{hDone}/{hs.length}</Text>
          <View style={st.track}><View style={[st.fill, { width: `${hs.length ? (hDone / hs.length) * 100 : 0}%`, backgroundColor: CATSTRONG[2] }]} /></View>
        </Pressable>
        <Pressable style={[st.mini, { flex: 1 }]} onPress={() => open('/dia')} accessibilityRole="button">
          <Text style={st.miniL}>Água</Text>
          <Text style={st.miniV}>{info.water}/8</Text>
          <View style={st.track}><View style={[st.fill, { width: `${(info.water / 8) * 100}%`, backgroundColor: CATSTRONG[0] }]} /></View>
        </Pressable>
      </View>

      </>),
    metas: () => (<>
      <Card title="Metas do mês" right={<Link onPress={() => open('/mes')} />}>
        {metas.length ? metas.map((m: any, i: number) => (
          <Row key={i} style={{ paddingVertical: 4 }}>
            <Ionicons name={m.ok ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={strong} />
            <Text style={[ui.t, m.ok && { textDecorationLine: 'line-through', color: C.muted }]}>{m.t}</Text>
          </Row>
        )) : <T muted>Defina até 3 metas na aba Mês.</T>}
      </Card>

      </>),
    financas: () => (<>
      <Card title="Saldo do mês" right={<Link onPress={() => open('/financas')} />}>
        <Text style={[st.money, fin.bal < 0 && { color: C.danger }]}>{brl(fin.bal)}</Text>
        <T muted small>entradas {brl(fin.inc)} · saídas {brl(fin.out)}</T>
      </Card>
      </>),
    atalhos: () => <Atalhos strong={strong} soft={soft} />,
    emocoes: () => <EmocoesMes />,
    ferramentas: () => (
      <Card title="Ferramentas" right={<Link onPress={() => router.navigate('/mais')} />}>
        <Row style={{ flexWrap: 'wrap', gap: 8 }}>
          {TOOLS.slice(0, 8).map((x) => (
            <Pressable key={x.k} onPress={() => router.navigate({ pathname: '/ferramenta', params: { k: x.k } })} style={st.toolChip} accessibilityRole="button">
              <Ionicons name={x.icon as any} size={15} color={strong} /><Text style={st.toolT}>{x.n}</Text>
            </Pressable>
          ))}
        </Row>
      </Card>
    ),
    backup: () => (
      <Card title="Cópia de segurança" right={<Link onPress={() => router.push('/conta')} />}>
        <T muted>Seus dados ficam salvos na sua conta. Se quiser um arquivo seu, baixe uma cópia em Conta.</T>
      </Card>
    ),
  };
  const order = listOf(docs['t-cfg'], 'home', DEF_HOME).filter((k) => B[k]);

  return (
    <Screen>
      <View style={st.top}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.eyebrow, { color: strong }]}>{DIASL[t.getDay()]}, {t.getDate()} de {MESES[t.getMonth()].toLowerCase()}{fer ? ` · ${fer}` : ''}</Text>
          <Text style={ui.h1}>{hello}</Text>
          <T muted small>{STATUS[status] ?? status}</T>
        </View>
        <IconBtn icon="person-circle-outline" label={`Conta ${email ?? ''}`} onPress={() => router.push('/conta')} size={28} color={C.ink} />
      </View>

      <AvisoAssinatura />
      {order.map((k) => <View key={k}>{B[k]()}</View>)}
    </Screen>
  );
}

const Link = ({ onPress }: { onPress: () => void }) => (
  <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link"><Text style={{ fontFamily: F.bodyMed, fontSize: 13, color: C.accent }}>abrir</Text></Pressable>
);

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: R.lg, padding: 20, marginBottom: 14 },
  heroN: { fontFamily: F.title, fontSize: 48, color: C.ink, lineHeight: 52 },
  heroOf: { fontSize: 28, color: C.muted },
  heroL: { fontFamily: F.body, fontSize: 14, color: C.ink },
  line: { borderBottomWidth: 1, borderBottomColor: C.hair, paddingVertical: 8 },
  time: { fontFamily: F.bodyMed, fontSize: 13, color: C.muted, width: 46 },
  two: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  mini: { backgroundColor: C.surface, borderRadius: R.lg, padding: 16 },
  miniL: { fontFamily: F.body, fontSize: 13, color: C.muted },
  miniV: { fontFamily: F.title, fontSize: 28, color: C.ink },
  track: { height: 6, backgroundColor: C.sand, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  fill: { height: 6 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 3, borderRadius: R.lg, padding: 18, marginBottom: 14, backgroundColor: C.surface },
  cdT: { flex: 1, fontFamily: F.body, fontSize: 16, color: C.ink },
  cdH: { fontFamily: F.title, fontSize: 24 },
  fav: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 14 },
  favC: { width: '48.5%', borderRadius: R.lg, padding: 14, minHeight: 92, overflow: 'hidden' },
  favN: { fontFamily: F.title, fontSize: 21, color: C.ink },
  favD: { fontFamily: F.body, fontSize: 12, color: C.ink, marginTop: 2, marginRight: 30 },
  toolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.sand, borderRadius: 999, paddingHorizontal: 12, minHeight: 34 },
  toolT: { fontFamily: F.bodyMed, fontSize: 13, color: C.ink },
  moodBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  money: { fontFamily: F.title, fontSize: 32, color: C.ink },
});

/** Lembrete gentil: só aparece nos últimos 3 dias do teste ou com pagamento pendente. */
function AvisoAssinatura() {
  const ac = useAcesso();
  const show = (ac.fase === 'teste' && (ac.dias ?? 99) <= 3) || ac.fase === 'atrasada';
  if (!show) return null;
  const txt = ac.fase === 'teste'
    ? `Seu teste grátis termina em ${ac.dias} dia${ac.dias === 1 ? '' : 's'}. Seus dados ficam guardados de qualquer jeito.`
    : 'Ainda não recebemos o último pagamento. Sem pressa, você tem alguns dias.';
  return (
    <Pressable onPress={() => router.push('/assinatura')} accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.sand, borderRadius: R.lg, padding: 16, marginBottom: 14 }}>
      <Ionicons name="sparkles-outline" size={20} color={C.accent} />
      <Text style={{ flex: 1, fontFamily: F.body, fontSize: 14, color: C.ink, lineHeight: 20 }}>{txt}</Text>
      <Text style={{ fontFamily: F.bodyMed, fontSize: 14, color: C.accent }}>Ver planos</Text>
    </Pressable>
  );
}
