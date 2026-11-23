import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { today } from '@/lib/dates';
import { monthColor } from '@/lib/planner';
import { assinar, brlPlano, cancelar, cpfValido, ehCortesia, Forma, mascaraCpf, Plano, PLANOS, useAcesso, useAssinatura } from '@/lib/assinatura';
import { Btn, Card, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

const dataBR = (d: Date | null) => (d ? d.toLocaleDateString('pt-BR') : '');

export default function Assinatura() {
  const sub = useAssinatura((s) => s.sub);
  const ac = useAcesso();
  const local = useAuth((a) => a.local);
  const [, strong] = monthColor(today());
  const [plano, setPlano] = useState<Plano>((sub?.plan as Plano) || 'anual');
  const [forma, setForma] = useState<Forma>((sub?.billing_type as Forma) || 'PIX');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cel, setCel] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const temAssinatura = !!sub?.asaas_subscription_id;
  const cortesia = ehCortesia(sub);
  const economia = Math.round((1 - PLANOS.anual.valor / (PLANOS.mensal.valor * 12)) * 100);

  async function ir() {
    setMsg('');
    if (nome.trim().split(/\s+/).length < 2) return setMsg('Digite seu nome completo.');
    if (!cpfValido(cpf)) return setMsg('Esse CPF não parece válido. Confira os números.');
    setBusy(true);
    try {
      const r = await assinar({ plano, forma, nome: nome.trim(), cpf, celular: cel });
      setMsg(r.link
        ? 'Abrimos a página de pagamento em outra aba. Quando o pagamento for confirmado, sua assinatura aparece aqui sozinha.'
        : 'Assinatura criada. A cobrança aparece no seu e-mail.');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelarAgora() {
    setBusy(true);
    try {
      const r = await cancelar();
      setConfirmCancel(false);
      setMsg(r.acessoAte ? `Assinatura cancelada. Você continua usando até ${new Date(r.acessoAte).toLocaleDateString('pt-BR')}.` : 'Assinatura cancelada.');
      const uid = useStore.getState().userId;
      if (uid) useAssinatura.getState().carregar(uid);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const titulo = {
    teste: `Seu teste grátis: ${ac.dias} dia${ac.dias === 1 ? '' : 's'}`,
    ativa: cortesia ? 'Acesso gratuito' : 'Assinatura ativa',
    atrasada: 'Pagamento pendente',
    cancelada: 'Assinatura cancelada',
    expirada: 'Seu teste grátis acabou',
    desconhecida: 'Assinatura',
  }[ac.fase];
  const sub2 = {
    teste: `Use tudo até ${dataBR(ac.ate)}. Se assinar agora, a primeira cobrança só vem depois disso.`,
    ativa: cortesia ? 'Sua conta tem acesso liberado para sempre, sem cobrança.' : `Plano ${sub?.plan === 'anual' ? 'anual' : 'mensal'}${sub?.billing_type === 'CREDIT_CARD' ? ', no cartão' : ', no Pix'}. Próxima renovação em ${dataBR(ac.ate)}.`,
    atrasada: 'Ainda não recebemos o último pagamento. Tudo bem, você tem alguns dias para resolver sem perder nada.',
    cancelada: `Você continua usando até ${dataBR(ac.ate)}. Pode assinar de novo quando quiser.`,
    expirada: 'Seus dados estão guardados. Assine para continuar usando, ou baixe uma cópia em Conta.',
    desconhecida: local ? 'No modo de teste sem conta não há assinatura.' : 'Carregando…',
  }[ac.fase];

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={ui.h1}>Assinatura</Text>
        {ac.liberado ? <IconBtn icon="close" label="Fechar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} size={26} color={C.ink} /> : null}
      </Row>

      <Card>
        <Text style={st.status}>{titulo}</Text>
        <T muted style={{ marginTop: 4, lineHeight: 21 }}>{sub2}</T>
      </Card>

      {local ? null : (
        <>
          {!cortesia && (ac.fase !== 'ativa' || temAssinatura === false) ? (
            <>
              <Text style={st.label}>Plano</Text>
              <View style={st.plans}>
                {(Object.keys(PLANOS) as Plano[]).map((k) => {
                  const p = PLANOS[k], on = plano === k;
                  return (
                    <Pressable key={k} onPress={() => setPlano(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={[st.plan, on && { borderColor: strong, backgroundColor: C.surface }]}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Text style={st.planN}>{p.nome}</Text>
                        <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? strong : C.faint} />
                      </Row>
                      <Text style={st.price}>{brlPlano(p.valor)}<Text style={st.suf}> {p.sufixo}</Text></Text>
                      <T muted small>{k === 'anual' ? `Economize ${economia}% (${brlPlano(p.valor / 12)} por mês)` : 'Cancele quando quiser'}</T>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={st.label}>Forma de pagamento</Text>
              <Row style={{ gap: 8 }}>
                {([['PIX', 'Pix', 'qr-code-outline'], ['CREDIT_CARD', 'Cartão de crédito', 'card-outline']] as const).map(([k, n, ic]) => {
                  const on = forma === k;
                  return (
                    <Pressable key={k} onPress={() => setForma(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={[st.opt, on && { backgroundColor: strong, borderColor: strong }]}>
                      <Ionicons name={ic} size={16} color={on ? '#fff' : C.muted} />
                      <Text style={[st.optT, on && { color: '#fff' }]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </Row>
              <T muted small style={{ marginTop: 6 }}>
                {forma === 'PIX' ? 'A cada renovação chega um Pix novo por e-mail para pagar.' : 'O cartão é cobrado sozinho a cada renovação.'} O pagamento é feito na página segura do Asaas.
              </T>

              <Text style={st.label}>Seus dados para a cobrança</Text>
              <Card style={{ gap: 4 }}>
                <TextInput value={nome} onChangeText={setNome} placeholder="Nome completo" placeholderTextColor={C.placeholder} style={ui.input} autoComplete="name" accessibilityLabel="Nome completo" />
                <TextInput value={cpf} onChangeText={(v) => setCpf(mascaraCpf(v))} placeholder="CPF" placeholderTextColor={C.placeholder} style={ui.input} keyboardType="number-pad" maxLength={14} accessibilityLabel="CPF" />
                <TextInput value={cel} onChangeText={setCel} placeholder="Celular com DDD (opcional)" placeholderTextColor={C.placeholder} style={ui.input} keyboardType="phone-pad" autoComplete="tel" accessibilityLabel="Celular" />
                <T muted small style={{ marginTop: 8 }}>O Asaas pede o CPF para emitir a cobrança. Seus dados de cartão não passam pelo Dear Days.</T>
              </Card>

              <Btn title={busy ? 'Abrindo…' : `Assinar e ir para o pagamento`} icon="lock-closed-outline" onPress={ir} disabled={busy} color={strong} style={{ minHeight: 50 }} />
            </>
          ) : null}

          {msg ? <T style={{ marginTop: 12, lineHeight: 21 }}>{msg}</T> : null}

          {cortesia ? null : (
          <Row style={{ justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', rowGap: 4 }}>
            <Btn kind="link" title="Já paguei, atualizar" icon="refresh-outline" color={C.accent}
              onPress={() => { const uid = useStore.getState().userId; if (uid) useAssinatura.getState().carregar(uid); }} />
            {temAssinatura ? (
              confirmCancel ? (
                <Row style={{ gap: 12 }}>
                  <Btn kind="link" title="Sim, cancelar" color={C.danger} onPress={cancelarAgora} disabled={busy} />
                  <Btn kind="link" title="Voltar" color={C.muted} onPress={() => setConfirmCancel(false)} />
                </Row>
              ) : <Btn kind="link" title="Cancelar assinatura" color={C.muted} onPress={() => setConfirmCancel(true)} />
            ) : null}
          </Row>
          )}
        </>
      )}

      {!ac.liberado ? (
        <Row style={{ marginTop: 20, gap: 14, justifyContent: 'center' }}>
          <Btn kind="link" title="Baixar cópia dos meus dados" icon="download-outline" color={C.accent} onPress={() => router.push('/conta')} />
          <Btn kind="link" title="Sair" color={C.muted} onPress={async () => { await useAuth.getState().signOut(); router.replace('/login'); }} />
        </Row>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  status: { fontFamily: F.title, fontSize: 26, color: C.ink },
  label: { fontFamily: F.bodySemi, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 18, marginBottom: 10 },
  plans: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  plan: { flexGrow: 1, flexBasis: 240, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: C.glass, borderRadius: R.lg, padding: 18, gap: 4 },
  planN: { fontFamily: F.bodyMed, fontSize: 16, color: C.ink },
  price: { fontFamily: F.title, fontSize: 32, color: C.ink },
  suf: { fontFamily: F.body, fontSize: 14, color: C.muted },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, minHeight: 44, backgroundColor: C.surface },
  optT: { fontFamily: F.bodyMed, fontSize: 14, color: C.ink },
});
