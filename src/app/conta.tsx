import { useState } from 'react';
import { Platform, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { Btn, Card, IconBtn, Row, Screen, T, s as ui } from '@/components/ui';
import { C, F } from '@/lib/theme';
import { askPermission, avisosOf } from '@/lib/notify';
import { useAcesso, useAssinatura } from '@/lib/assinatura';

export default function Conta() {
  const email = useAuth((a) => a.email);
  const local = useAuth((a) => a.local);
  const count = useStore((s) => Object.keys(s.docs).length);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  /** Baixa uma cópia de tudo no mesmo formato do planner web ("Baixar cópia"). */
  async function baixar() {
    setMsg('');
    const d = new Date();
    const name = `dear-days-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    // "planner: 'meu-planner'" continua igual para as cópias antigas e novas serem compatíveis
    const json = JSON.stringify({ planner: 'meu-planner', salvoEm: d.toISOString(), dados: useStore.getState().docs }, null, 1);
    try {
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url; a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else {
        const f = new File(Paths.cache, name);
        try { f.create({ overwrite: true } as any); } catch {}
        await f.write(json);
        await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Salvar cópia do planner' });
      }
      setMsg('Cópia pronta. Guarde o arquivo em um lugar seguro.');
    } catch {
      setMsg('Não foi possível gerar a cópia agora. Tente de novo.');
    }
  }

  async function importar() {
    setMsg('');
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    try {
      const a: any = res.assets[0];
      const text: string = Platform.OS === 'web' && a.file ? await a.file.text() : await new File(a.uri).text();
      const j = JSON.parse(text);
      const dados = j && j.planner === 'meu-planner' && j.dados ? j.dados : null;
      if (!dados || typeof dados !== 'object') throw new Error('formato');
      const n = await useStore.getState().importAll(dados);
      setMsg(`Pronto: ${n} páginas importadas${j.salvoEm ? ` (cópia de ${new Date(j.salvoEm).toLocaleDateString('pt-BR')})` : ''}.`);
    } catch {
      setMsg('Esse arquivo não parece uma cópia do Dear Days. Use o arquivo baixado em "Baixar cópia" no planner web.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={ui.h1}>Conta</Text>
        <IconBtn icon="close" label="Fechar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} size={26} color={C.ink} />
      </Row>

      <Card title="Você">
        <T>{email ?? 'sem e-mail'}</T>
        <T muted small style={{ marginTop: 4 }}>{count} páginas com dados{local ? ', guardadas só neste aparelho' : ', sincronizadas com o site'}</T>
      </Card>

      {!local ? <AssinaturaCard /> : null}
      {!local ? <Senha /> : null}
      <Avisos />

      <Card title="Cópia de segurança">
        <T muted style={{ marginBottom: 12, lineHeight: 21 }}>
          Para trazer o que você já tinha no planner antigo do Claude: lá, vá em Ajustes e toque em “Baixar cópia”, depois escolha aqui o arquivo .json. Páginas com o mesmo dia ou mês são substituídas pelas do arquivo. “Baixar cópia” aqui guarda tudo o que está na sua conta.
        </T>
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          <Btn title={busy ? 'Importando...' : 'Escolher arquivo de cópia'} icon="cloud-upload-outline" onPress={importar} disabled={busy} />
          <Btn kind="soft" title="Baixar cópia" icon="download-outline" onPress={baixar} color={C.ink} />
        </Row>
        {msg ? <T style={{ marginTop: 10 }}>{msg}</T> : null}
      </Card>

      <View style={{ marginTop: 8 }}>
        <Btn kind="soft" title="Sair" icon="log-out-outline" color={C.danger}
          onPress={async () => { await useAuth.getState().signOut(); router.replace('/login'); }} />
      </View>
    </Screen>
  );
}

const OPC: { k: 'tarefas' | 'agua' | 'compras'; t: string; d: string }[] = [
  { k: 'tarefas', t: 'Início das tarefas', d: 'Um aviso na hora marcada, com o primeiro passo. No máximo 8 por dia.' },
  { k: 'agua', t: 'Beber água', d: '4 lembretes por dia (10h, 13h, 16h e 19h). Some se você já marcou os copos.' },
  { k: 'compras', t: 'Compras para esperar', d: 'Pergunta depois de 24 horas se você ainda quer comprar.' },
];

function Avisos() {
  const docs = useStore((s) => s.docs);
  const set = useStore((s) => s.set);
  const av = avisosOf(docs);
  const [msg, setMsg] = useState('');
  async function toggle(k: 'tarefas' | 'agua' | 'compras', v: boolean) {
    setMsg('');
    if (v) {
      const ok = await askPermission();
      if (!ok) {
        setMsg(Platform.OS === 'web' ? 'Os avisos funcionam no app do celular.' : 'O celular não deixou enviar avisos. Libere nas configurações do aparelho, em Notificações.');
        return;
      }
    }
    set('t-cfg', `app.avisos.${k}`, v);
  }
  return (
    <Card title="Avisos">
      <T muted style={{ marginBottom: 6, lineHeight: 21 }}>Poucos e gentis. Ligue só o que ajuda você.</T>
      {OPC.map((o) => (
        <Row key={o.k} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.hair }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.bodyMed, fontSize: 15, color: C.ink }}>{o.t}</Text>
            <T muted small>{o.d}</T>
          </View>
          <Switch value={!!av[o.k]} onValueChange={(v) => toggle(o.k, v)} trackColor={{ true: C.accent, false: C.line }} thumbColor="#fff" accessibilityLabel={o.t} />
        </Row>
      ))}
      {msg ? <T style={{ marginTop: 8 }}>{msg}</T> : null}
    </Card>
  );
}

function AssinaturaCard() {
  const ac = useAcesso();
  const plan = useAssinatura((s) => s.sub?.plan);
  const ate = ac.ate ? ac.ate.toLocaleDateString('pt-BR') : '';
  const linha = {
    teste: `Teste grátis até ${ate}`,
    ativa: `Plano ${plan === 'anual' ? 'anual' : 'mensal'}, renova em ${ate}`,
    atrasada: 'Pagamento pendente',
    cancelada: `Cancelada, você usa até ${ate}`,
    expirada: 'Teste grátis encerrado',
    desconhecida: 'Ainda carregando',
  }[ac.fase];
  return (
    <Card title="Assinatura">
      <T>{linha}</T>
      <Btn kind="link" title={ac.fase === 'ativa' ? 'Ver ou mudar o plano' : 'Ver planos e assinar'} icon="card-outline" color={C.accent} onPress={() => router.push('/assinatura')} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
    </Card>
  );
}

function Senha() {
  const [p, setP] = useState('');
  const [msg, setMsg] = useState('');
  async function salvar() {
    if (p.length < 6) return setMsg('A senha precisa de pelo menos 6 caracteres.');
    const { error } = await supabase.auth.updateUser({ password: p });
    setMsg(error ? 'Não foi possível trocar agora. Tente de novo.' : 'Senha nova salva.');
    if (!error) setP('');
  }
  return (
    <Card title="Senha">
      <Row>
        <TextInput value={p} onChangeText={setP} secureTextEntry placeholder="Nova senha" placeholderTextColor="#A39A90" autoComplete="new-password"
          style={{ flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, minHeight: 44 }} />
        <Btn title="Salvar" onPress={salvar} />
      </Row>
      {msg ? <T muted small style={{ marginTop: 6 }}>{msg}</T> : null}
    </Card>
  );
}
