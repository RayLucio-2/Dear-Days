import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useAuth, useSignedIn } from '@/lib/auth';
import { Btn, Screen } from '@/components/ui';
import { C, F, R } from '@/lib/theme';

type Mode = 'entrar' | 'criar' | 'esqueci';

/** No site, o link do e-mail volta para o próprio site. No app, usa o Site URL do Supabase. */
const siteUrl = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined);

/** Mensagens do servidor em português. */
function traduz(m: string) {
  if (/fetch|network|load failed/i.test(m)) return 'Não consegui falar com o servidor. Confira a internet e tente de novo em instantes.';
  if (/already registered/i.test(m)) return 'Esse e-mail já tem conta. Toque em "Já tenho conta" para entrar.';
  if (/at least 6/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (/invalid email|unable to validate email/i.test(m)) return 'Esse e-mail não parece válido.';
  return m;
}

export default function Login() {
  const signed = useSignedIn();
  const q = useLocalSearchParams<{ criar?: string }>();
  const [mode, setMode] = useState<Mode>(q.criar ? 'criar' : 'entrar');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (signed) return <Redirect href="/" />;

  async function go() {
    setMsg('');
    if (!email.includes('@')) return setMsg('Digite um e-mail válido.');
    if (mode !== 'esqueci' && pass.length < 6) return setMsg('A senha precisa de pelo menos 6 caracteres.');
    setBusy(true);
    try {
      if (mode === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) setMsg(error.message.includes('Invalid') ? 'E-mail ou senha incorretos.' : traduz(error.message));
      } else if (mode === 'criar') {
        const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: siteUrl() } });
        if (error) setMsg(traduz(error.message));
        else if (!data.session) setMsg('Conta criada. Confira seu e-mail para confirmar e depois entre.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() });
        setMsg(error ? traduz(error.message) : 'Se o e-mail existir, você vai receber um link para criar outra senha.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={st.top}>
          <Text style={st.brand}>Dear Days</Text>
          <Text style={st.sub}>Um dia de cada vez, com leveza.</Text>
        </View>

        <View style={st.box}>
          {!supabaseReady ? (
            <>
              <Text style={st.warn}>
                O Supabase ainda não foi configurado (arquivo .env). Você pode testar o app agora com os dados guardados só neste aparelho.
              </Text>
              <Btn title="Testar sem conta" onPress={() => useAuth.getState().enterLocal()} icon="phone-portrait-outline" />
            </>
          ) : (
            <>
              <Text style={st.h}>{mode === 'entrar' ? 'Entrar' : mode === 'criar' ? 'Criar conta' : 'Recuperar senha'}</Text>
              <Text style={st.label}>E-mail</Text>
              <TextInput style={st.inp} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="voce@email.com" placeholderTextColor={C.placeholder} />
              {mode !== 'esqueci' ? (
                <>
                  <Text style={st.label}>Senha</Text>
                  <TextInput style={st.inp} value={pass} onChangeText={setPass} secureTextEntry autoComplete={mode === 'criar' ? 'new-password' : 'current-password'} placeholder="mínimo 6 caracteres" placeholderTextColor={C.placeholder} onSubmitEditing={go} />
                </>
              ) : null}
              {msg ? <Text style={st.msg} accessibilityLiveRegion="polite">{msg}</Text> : null}
              <Btn title={busy ? 'Aguarde...' : mode === 'entrar' ? 'Entrar' : mode === 'criar' ? 'Criar conta' : 'Enviar link'} onPress={go} disabled={busy} style={{ marginTop: 16 }} />
              {mode === 'criar' ? (
                <Text style={st.legal}>
                  7 dias grátis, sem cartão. Ao criar a conta, você concorda com os{' '}
                  <Text style={st.legalL} onPress={() => router.push('/termos')}>Termos de uso</Text> e a{' '}
                  <Text style={st.legalL} onPress={() => router.push('/privacidade')}>Política de privacidade</Text>.
                </Text>
              ) : null}
              <View style={st.links}>
                {mode !== 'entrar' ? <Btn kind="link" title="Já tenho conta" onPress={() => { setMode('entrar'); setMsg(''); }} color={C.accent} /> : null}
                {mode !== 'criar' ? <Btn kind="link" title="Criar conta" onPress={() => { setMode('criar'); setMsg(''); }} color={C.accent} /> : null}
                {mode === 'entrar' ? <Btn kind="link" title="Esqueci a senha" onPress={() => { setMode('esqueci'); setMsg(''); }} color={C.muted} /> : null}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const st = StyleSheet.create({
  legal: { fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  legalL: { color: C.accent, textDecorationLine: 'underline' },
  top: { alignItems: 'center', marginTop: 48, marginBottom: 28, gap: 6 },
  brand: { fontFamily: F.title, fontSize: 40, color: C.ink },
  sub: { fontFamily: F.body, fontSize: 15, color: C.muted, textAlign: 'center' },
  box: { backgroundColor: C.surface, borderRadius: R.lg, padding: 24, maxWidth: 420, width: '100%', alignSelf: 'center', gap: 4 },
  h: { fontFamily: F.title, fontSize: 24, color: C.ink, marginBottom: 8 },
  label: { fontFamily: F.bodyMed, fontSize: 13, color: C.muted, marginTop: 8 },
  inp: { fontFamily: F.body, fontSize: 16, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 12, minHeight: 46, backgroundColor: C.bg },
  msg: { fontFamily: F.body, fontSize: 14, color: C.danger, marginTop: 10 },
  warn: { fontFamily: F.body, fontSize: 14, color: C.muted, marginBottom: 14, lineHeight: 21 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, marginTop: 10 },
});
