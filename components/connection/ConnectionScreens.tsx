import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useReducedMotion } from 'react-native-reanimated';

import { customAlert } from '@/lib/helpers';

export type CheckState = 'waiting' | 'checking' | 'success' | 'error';
export type ConnectionChecks = Record<'server' | 'database' | 'account', CheckState>;
export const INITIAL_CHECKS: ConnectionChecks = {
  server: 'checking', database: 'checking', account: 'waiting',
};

const STEPS = [
  { key: 'server', label: 'Server', message: 'Provera konekcije sa serverom…', icon: 'server' },
  { key: 'database', label: 'Baza podataka', message: 'Provera konekcije sa bazom podataka…', icon: 'database' },
  { key: 'account', label: 'Nalog', message: 'Provera naloga…', icon: 'user' },
] as const;

function TypedStatus({ message }: { message: string }) {
  const [length, setLength] = useState(0);
  const [cursorOpacity] = useState(() => new Animated.Value(1));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setLength(current);
      if (current >= message.length) clearInterval(timer);
    }, 32);
    const cursor = Animated.loop(Animated.sequence([
      Animated.timing(cursorOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(cursorOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]));
    cursor.start();
    return () => { clearInterval(timer); cursor.stop(); };
  }, [message, cursorOpacity, reduceMotion]);

  return (
    <View style={styles.typedStatus} accessible accessibilityLabel={message} accessibilityLiveRegion='polite'>
      <Text style={[styles.statusMessage, { opacity: 0 }]} importantForAccessibility='no-hide-descendants'>
        {message}
      </Text>
      <Text style={[styles.statusMessage, styles.typedOverlay]} importantForAccessibility='no-hide-descendants'>
        {reduceMotion ? message : message.slice(0, length)}
        {!reduceMotion && length < message.length && <Animated.Text style={{ opacity: cursorOpacity, color: '#2368fd' }}>│</Animated.Text>}
      </Text>
    </View>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CheckRow({ step, state }: { step: typeof STEPS[number]; state: CheckState }) {
  const statusText = { waiting: 'Na čekanju', checking: 'Provera u toku', success: 'Spremno', error: 'Nedostupno' }[state];
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkIcon, state === 'success' && styles.successBackground, state === 'error' && styles.errorBackground]}>
        <Feather name={step.icon} size={18} color={state === 'error' ? '#c65a43' : state === 'success' ? '#25866b' : '#71809a'} />
      </View>
      <View style={styles.checkLabel}>
        <Text style={styles.checkTitle}>{step.label}</Text>
        <Text style={styles.checkSubtitle}>{statusText}</Text>
      </View>
      {state === 'checking' ? <ActivityIndicator size='small' color='#2368fd' />
        : <Feather name={state === 'success' ? 'check-circle' : state === 'error' ? 'alert-circle' : 'circle'} size={19} color={state === 'success' ? '#25866b' : state === 'error' ? '#c65a43' : '#c4ccdb'} />}
    </View>
  );
}

export function ConnectionLoadingScreen({ checks }: { checks: ConnectionChecks }) {
  const activeStep = STEPS.find((step) => checks[step.key] === 'checking') ?? STEPS[2];
  return (
    <ScreenShell>
      <View style={styles.heroCircle}>
        <View style={styles.heroInner}><MaterialCommunityIcons name='cloud-sync-outline' size={45} color='#2368fd' /></View>
      </View>
      <Text style={styles.eyebrow}>POVEZIVANJE</Text>
      <Text style={styles.title}>Pripremamo aplikaciju</Text>
      <Text style={styles.subtitle}>Samo trenutak, proveravamo da li je sve spremno za skeniranje vaših računa.</Text>
      <View style={styles.card}>
        <View style={styles.statusHeading}><ActivityIndicator size='small' color='#2368fd' /><Text style={styles.cardEyebrow}>PROVERA U TOKU</Text></View>
        <TypedStatus key={activeStep.key} message={activeStep.message} />
        <View style={styles.divider} />
        {STEPS.map((step) => <CheckRow key={step.key} step={step} state={checks[step.key]} />)}
      </View>
    </ScreenShell>
  );
}

export function ConnectionErrorScreen({ checks, onRetry }: {
  checks: ConnectionChecks;
  onRetry: () => void;
}) {
  const accountError = checks.account === 'error';
  const description = accountError
    ? 'Provera naloga nije završena. Pokušajte ponovo za nekoliko trenutaka.'
    : checks.server === 'error' && checks.database === 'error'
      ? 'Server i baza podataka trenutno nisu dostupni. Povezivanje nije završeno.'
      : checks.database === 'error'
        ? 'Veza sa bazom podataka trenutno nije dostupna. Povezivanje nije završeno.'
        : 'Veza sa serverom trenutno nije dostupna. Povezivanje nije završeno.';

  const contactSupport = async () => {
    try {
      await Linking.openURL('mailto:podrska@calculus.rs?subject=Problem%20sa%20povezivanjem%20-%20Calculus%20%C4%8Cita%C4%8D%20Fiskala');
    } catch {
      customAlert('Korisnička podrška', 'Kontaktirajte nas na podrska@calculus.rs.');
    }
  };

  return (
    <ScreenShell>
      <View style={[styles.heroCircle, styles.errorHero]}>
        <View style={[styles.heroInner, styles.errorHeroInner]}><Feather name='wifi-off' size={39} color='#c65a43' /></View>
      </View>
      <Text style={[styles.eyebrow, styles.errorEyebrow]}>KONEKCIJA NIJE DOSTUPNA</Text>
      <Text style={styles.title}>Povezivanje nije uspelo</Text>
      <Text style={styles.subtitle}>{description}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Šta možete da uradite?</Text>
        <Text style={styles.helpText}>Proverite internet vezu i pokušajte ponovo. Ako imate pristup internetu, moguće je da je Calculus servis privremeno nedostupan.</Text>
        <View style={styles.divider} />
        {STEPS.filter((step) => checks[step.key] !== 'waiting').map((step) => <CheckRow key={step.key} step={step} state={checks[step.key]} />)}
      </View>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton} accessibilityRole='button'>
        <Feather name='refresh-cw' size={18} color='white' /><Text style={styles.retryText}>Pokušaj ponovo</Text>
      </TouchableOpacity>
      <View style={styles.supportCard}>
        <Feather name='headphones' size={21} color='#2368fd' />
        <View style={styles.supportContent}>
          <Text style={styles.supportText}>Kontaktirajte korisničku podršku ako se problem nastavi.</Text>
          <TouchableOpacity onPress={contactSupport} accessibilityRole='link' accessibilityLabel='Kontaktirajte podršku na podrska@calculus.rs'>
            <Text style={styles.supportEmail}>podrska@calculus.rs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white', overflow: 'hidden' },
  screenContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center', alignItems: 'center' },
  heroCircle: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#e6edff', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#d9e5ff', alignItems: 'center', justifyContent: 'center' },
  errorHero: { backgroundColor: '#fff0eb' },
  errorHeroInner: { backgroundColor: '#ffe3d9' },
  eyebrow: { fontFamily: 'Rubik-Medium', fontSize: 10, letterSpacing: 1.5, color: '#2368fd', textAlign: 'center', marginBottom: 10 },
  errorEyebrow: { color: '#b65440' },
  title: { fontFamily: 'Rubik-Bold', fontSize: 27, lineHeight: 34, color: '#1e2d4d', textAlign: 'center' },
  subtitle: { fontFamily: 'Rubik-Regular', fontSize: 14, lineHeight: 22, color: '#71809a', textAlign: 'center', marginTop: 12, marginBottom: 26 },
  card: { width: '100%', padding: 22, borderRadius: 24, backgroundColor: 'white', borderWidth: 1, borderColor: '#e4eaf5' },
  statusHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 15 },
  cardEyebrow: { fontFamily: 'Rubik-Medium', fontSize: 10, letterSpacing: 1.1, color: '#71809a' },
  typedStatus: { minHeight: 58, justifyContent: 'center' },
  statusMessage: { fontFamily: 'Rubik-Medium', fontSize: 19, lineHeight: 27, color: '#1e2d4d', textAlign: 'center' },
  typedOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  divider: { height: 1, backgroundColor: '#edf1f8', marginTop: 16, marginBottom: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 13, paddingBottom: 7 },
  checkIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f2f5fb', justifyContent: 'center', alignItems: 'center' },
  successBackground: { backgroundColor: '#eaf7f1' },
  errorBackground: { backgroundColor: '#fff0eb' },
  checkLabel: { flex: 1 },
  checkTitle: { fontFamily: 'Rubik-Medium', fontSize: 13, color: '#34435d' },
  checkSubtitle: { fontFamily: 'Rubik-Regular', fontSize: 11, color: '#8591a7', marginTop: 3 },
  cardTitle: { fontFamily: 'Rubik-Medium', fontSize: 15, color: '#34435d', marginBottom: 8 },
  helpText: { fontFamily: 'Rubik-Regular', fontSize: 13, lineHeight: 21, color: '#71809a' },
  retryButton: { width: '100%', flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#2368fd', marginTop: 20 },
  retryText: { fontFamily: 'Rubik-Medium', fontSize: 15, color: 'white' },
  supportCard: { width: '100%', flexDirection: 'row', gap: 12, padding: 17, borderRadius: 16, backgroundColor: '#eaf0ff', marginTop: 14 },
  supportContent: { flex: 1 },
  supportText: { fontFamily: 'Rubik-Regular', fontSize: 12, lineHeight: 19, color: '#5b6c8b' },
  supportEmail: { fontFamily: 'Rubik-Medium', fontSize: 14, color: '#2368fd', marginTop: 6, paddingVertical: 5 },
});
