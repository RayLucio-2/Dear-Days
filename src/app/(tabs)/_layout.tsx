import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Redirect, router, Tabs, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSignedIn } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { C, F } from '@/lib/theme';
import { useWide } from '@/lib/layout';
import { DEF_TABS, listOf, MOBILE_TABS, TAB_VIEWS } from '@/lib/prefs';
import { useAcesso, useAssinatura } from '@/lib/assinatura';
import { QuickCapture } from '@/components/QuickCapture';
import { syncNotifications } from '@/lib/notify';

/** Esconde a rota do menu sem tirá-la da navegação (href: null quebra o acesso direto). */
const HIDE = { tabBarButton: () => null, tabBarItemStyle: { display: 'none' as const } };

const ICON: Record<string, [any, any]> = {
  index: ['home-outline', 'home'],
  dia: ['sunny-outline', 'sunny'],
  habitos: ['leaf-outline', 'leaf'],
  mes: ['calendar-outline', 'calendar'],
  financas: ['wallet-outline', 'wallet'],
  semana: ['albums-outline', 'albums'],
  emocoes: ['flower-outline', 'flower'],
  graficos: ['bar-chart-outline', 'bar-chart'],
  mais: ['apps-outline', 'apps'],
  ano: ['calendar-number-outline', 'calendar-number'],
  rotina: ['repeat-outline', 'repeat'],
};

const LABEL: Record<string, string> = Object.fromEntries(TAB_VIEWS);

export default function TabsLayout() {
  const signed = useSignedIn();
  const ready = useStore((s) => s.ready);
  const docs = useStore((s) => s.docs);
  const wide = useWide();
  const acesso = useAcesso();
  const subOk = useAssinatura((s) => s.carregado);
  const cfg = docs['t-cfg'];
  const path = usePathname();
  // Tela que abre primeiro (Personalizar > Abrir o app em)
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const st = cfg?.app?.start;
    if (path === '/' && (st === 'dia' || st === 'foco')) {
      if (st === 'foco' && !cfg?.app?.foco) useStore.getState().set('t-cfg', 'app.foco', true);
      setTimeout(() => router.navigate('/dia'), 0);
    }
  }, [ready, cfg, path]);
  // Reagenda os avisos alguns segundos depois de qualquer mudança (tarefas, água, compras).
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => { syncNotifications(docs); }, 2500);
    return () => clearTimeout(t);
  }, [docs, ready]);
  const valid = TAB_VIEWS.map(([v]) => v);
  const chosen = listOf(cfg, 'tabs', DEF_TABS).filter((v) => valid.includes(v));
  const shown = wide ? chosen : chosen.slice(0, MOBILE_TABS);
  if (!signed) return <Redirect href="/login" />;
  // Teste grátis acabou e não há assinatura: vai para a tela de assinar (os dados continuam guardados)
  if (subOk && !acesso.liberado) return <Redirect href="/assinatura" />;
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: '#A89E94',
        ...(wide
          ? {
              // computador: menu na lateral, com o nome ao lado do ícone
              tabBarPosition: 'left' as const,
              tabBarVariant: 'material' as const,
              tabBarLabelPosition: 'beside-icon' as const,
              tabBarStyle: { backgroundColor: C.bg, borderRightColor: C.hair, width: 230, minWidth: 230, maxWidth: 230, flexGrow: 0, flexShrink: 0, paddingTop: 20 },
              tabBarItemStyle: { justifyContent: 'flex-start', paddingHorizontal: 14, borderRadius: 12, marginHorizontal: 8, marginVertical: 1, minHeight: 44 },
              tabBarActiveBackgroundColor: C.surface,
              tabBarLabelStyle: { fontFamily: F.body, fontSize: 14, marginLeft: 10 },
            }
          : {
              tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.hair, elevation: 0, shadowOpacity: 0, ...(Platform.OS === 'web' ? { height: 70, paddingTop: 6, paddingBottom: 12 } : null) },
              tabBarLabelStyle: { fontFamily: F.body, fontSize: 11, lineHeight: 16, paddingBottom: 2 },
            }),
        tabBarIcon: ({ focused, color, size }) => <Ionicons name={ICON[route.name]?.[focused ? 1 : 0] ?? 'ellipse'} size={wide ? 20 : size - 2} color={color as string} />,
      })}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      {/* Abas na ordem escolhida em Personalizar; no celular cabem 4 + Mais. As outras ficam escondidas, mas abrem pelo Mais. */}
      {[...shown, ...TAB_VIEWS.map(([v]) => v).filter((v) => !shown.includes(v))].map((v) => (
        <Tabs.Screen key={v} name={v} options={{ title: LABEL[v], ...(shown.includes(v) ? {} : HIDE) }} />
      ))}
      <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
      <Tabs.Screen name="ferramenta" options={{ title: 'Ferramenta', ...HIDE }} />
      <Tabs.Screen name="personalizar" options={{ title: 'Personalizar', ...HIDE }} />
    </Tabs>
    <QuickCapture />
    </View>
  );
}
