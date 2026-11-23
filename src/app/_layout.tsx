import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, EBGaramond_400Regular_Italic, EBGaramond_500Medium } from '@expo-google-fonts/eb-garamond';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { useAuth } from '@/lib/auth';
import { initNotifications } from '@/lib/notify';
import { registrarSW } from '@/lib/push';
import { C, DARK } from '@/lib/theme';

export default function RootLayout() {
  const [fontsOk] = useFonts({ EBGaramond_400Regular_Italic, EBGaramond_500Medium, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold });
  const loading = useAuth((a) => a.loading);
  useEffect(() => useAuth.getState().start(), []);
  useEffect(() => { initNotifications(); registrarSW(); }, []);

  if (!fontsOk || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <StatusBar style={DARK ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="conta" options={{ presentation: 'modal' }} />
        <Stack.Screen name="caixa" options={{ presentation: 'modal' }} />
        <Stack.Screen name="revisao" options={{ presentation: 'modal' }} />
        <Stack.Screen name="assinatura" options={{ presentation: 'modal' }} />
        <Stack.Screen name="termos" options={{ presentation: 'modal' }} />
        <Stack.Screen name="privacidade" options={{ presentation: 'modal' }} />
        <Stack.Screen name="bemvindo" />
      </Stack>
    </SafeAreaProvider>
  );
}
