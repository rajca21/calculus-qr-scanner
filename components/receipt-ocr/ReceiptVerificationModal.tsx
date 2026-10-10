import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import WebView from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import LoadingButtonContent from '@/components/ui/LoadingButtonContent';
import {
  buildVerificationScript, COUNTER_SUFFIXES, isOfficialPage, isOfficialReceiptUrl,
  ReceiptVerificationDraft, validateVerificationDraft, VERIFICATION_PAGE,
} from '@/lib/receipt-verification';
import { buildJournalQrScript, decodeJournalQr } from '@/lib/journal-qr';

type Props = {
  onClose: () => void;
  onImport: (url: string, draft: ReceiptVerificationDraft) => Promise<boolean>;
};

const fields: { key: keyof ReceiptVerificationDraft; label: string; placeholder: string }[] = [
  { key: 'invoiceNumber', label: 'PFR broj računa', placeholder: 'XXXXXXXX-XXXXXXXX-123' },
  { key: 'counter', label: 'Brojač računa', placeholder: '123/123' },
  { key: 'totalAmount', label: 'Ukupan iznos', placeholder: '3.060,00' },
  { key: 'dateTime', label: 'PFR vreme', placeholder: '10.10.2026. 14:35:12' },
];

export default function ReceiptVerificationModal({ onClose, onImport }: Props) {
  const [draft, setDraft] = useState<ReceiptVerificationDraft>({
    invoiceNumber: '', counter: '', suffix: '', totalAmount: '', dateTime: '',
  });
  const [step, setStep] = useState<'entry' | 'website' | 'import'>('entry');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanningQr, setScanningQr] = useState(false);
  const webView = useRef<WebView>(null);
  const importing = useRef(false);
  const qrRequest = useRef(0);
  const qrTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const stopQrScan = () => {
    qrRequest.current++;
    if (qrTimeout.current) clearTimeout(qrTimeout.current);
    qrTimeout.current = null;
    setScanningQr(false);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (qrTimeout.current) clearTimeout(qrTimeout.current);
    };
  }, []);

  const acceptQrUrl = (value: string) => {
    stopQrScan();
    setUrl(value);
    setError('');
    setStep('import');
  };

  const scanJournalQr = () => {
    if (scanningQr) return;
    const requestId = ++qrRequest.current;
    setScanningQr(true);
    setError('');
    setStatus('Čitanje QR koda iz otvorenog žurnala…');
    qrTimeout.current = setTimeout(() => {
      if (!mounted.current || requestId !== qrRequest.current) return;
      stopQrScan();
      setError('QR kod nije pročitan. Otvorite „Žurnal“ da se kod prikaže i pokušajte ponovo, ili učitajte snimak ekrana.');
    }, 60000);
    webView.current?.injectJavaScript(buildJournalQrScript(requestId));
  };

  const scanScreenshot = async () => {
    if (scanningQr) return;
    const requestId = ++qrRequest.current;
    setScanningQr(true);
    setError('');
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Nije dozvoljen pristup galeriji. Omogućite ga u podešavanjima telefona.');
      }
      const image = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: false });
      if (!mounted.current || requestId !== qrRequest.current || image.canceled) return;
      const results = await Camera.scanFromURLAsync(image.assets[0].uri, ['qr']);
      if (!mounted.current || requestId !== qrRequest.current) return;
      const result = results.find((code) => isOfficialReceiptUrl(code.data));
      if (!result) throw new Error('Na slici nije pronađen QR kod fiskalnog računa. Izaberite snimak ekrana sa jasno prikazanim QR kodom.');
      acceptQrUrl(result.data);
    } catch (failure) {
      if (mounted.current && requestId === qrRequest.current)
        setError(failure instanceof Error ? failure.message : 'Snimak ekrana nije pročitan. Pokušajte ponovo.');
    } finally {
      if (mounted.current && requestId === qrRequest.current) stopQrScan();
    }
  };

  const verify = () => {
    const message = validateVerificationDraft(draft);
    if (message) { setError(message); return; }
    Keyboard.dismiss();
    setError('');
    setStatus('Proverite polja i pritisnite „Pošalji“. Zatim otvorite „Žurnal“ i izaberite „Učitaj QR iz žurnala“ ispod.');
    setStep('website');
  };

  const importReceipt = async () => {
    if (importing.current) return;
    if (!isOfficialReceiptUrl(url.trim())) {
      setError('Unesite adresu fiskalnog računa sa suf.purs.gov.rs/v/?vl=…');
      return;
    }
    importing.current = true;
    setLoading(true);
    setError('');
    try {
      if (await onImport(url.trim(), draft)) onClose();
      else setError('Račun nije učitan. Proverite adresu i podatke, pa pokušajte ponovo.');
    } catch {
      setError('Račun nije učitan. Proverite internet vezu i pokušajte ponovo.');
    } finally {
      importing.current = false;
      setLoading(false);
    }
  };

  const openExternal = async () => {
    try { await WebBrowser.openBrowserAsync(VERIFICATION_PAGE); }
    catch { setError('Nije moguće otvoriti stranicu Poreske uprave.'); }
  };

  return (
    <Modal visible animationType='slide' presentationStyle='fullScreen' statusBarTranslucent navigationBarTranslucent
      onRequestClose={() => { if (!loading) onClose(); }}>
      <SafeAreaProvider style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Račun bez QR koda</Text>
          <Pressable accessibilityRole='button' disabled={loading} onPress={onClose} hitSlop={12}>
            <Text style={styles.link}>Zatvori</Text>
          </Pressable>
        </View>
        {step === 'website' ? (
          <View style={styles.website}>
            <Text style={styles.notice}>{status}</Text>
            {!!error && <Text accessibilityRole='alert' style={styles.error}>{error}</Text>}
            <WebView
              ref={webView}
              style={styles.webView}
              containerStyle={styles.webView}
              source={{ uri: VERIFICATION_PAGE }}
              originWhitelist={['https://*']}
              javaScriptEnabled
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={(request) => {
                // CAPTCHA frames use Google's own origin; top-level navigation stays on SUF.
                return request.isTopFrame === false || isOfficialPage(request.url);
              }}
              onLoadEnd={() => webView.current?.injectJavaScript(buildVerificationScript(draft))}
              onLoadStart={() => { stopQrScan(); setError(''); }}
              onMessage={(event) => {
                if (!mounted.current) return;
                if (!isOfficialPage(event.nativeEvent.url)) return;
                if (event.nativeEvent.data.length > 1500000) return;
                try {
                  const message: unknown = JSON.parse(event.nativeEvent.data);
                  if (!message || typeof message !== 'object' || !('type' in message)) return;
                  if ('requestId' in message && message.requestId === qrRequest.current) {
                    if (message.type === 'journal-qr-not-found') {
                      stopQrScan();
                      setError('QR kod nije pronađen. Otvorite „Žurnal“ i pokušajte ponovo, ili učitajte snimak ekrana sa QR kodom.');
                    }
                    if (message.type === 'journal-qr-pixels') {
                      const recovered = decodeJournalQr(message);
                      webView.current?.injectJavaScript(`window.__calculusQrReply && window.__calculusQrReply(${qrRequest.current}, ${!!recovered}); true;`);
                      if (recovered) acceptQrUrl(recovered);
                    }
                  }
                  if (message.type === 'unsupported') setStatus('Proverite i popunite polja ručno; stranica se možda promenila.');
                  if (message.type === 'receipt-url' && 'url' in message && typeof message.url === 'string' && isOfficialReceiptUrl(message.url)) {
                    setUrl(message.url);
                    setStatus('Pronađena je adresa računa. Izaberite „Učitaj račun“ ispod.');
                  }
                } catch { /* Ignore unrelated/malformed messages from page scripts. */ }
              }}
              onError={() => setError('Stranica nije dostupna. Pokušajte ponovo ili otvorite pregledač.')}
              onHttpError={() => setError('Poreska uprava nije vratila stranicu. Pokušajte ponovo.')}
              startInLoadingState
              renderLoading={() => <ActivityIndicator style={styles.webLoading} size='small' color='#2368fd' />}
            />
            <View style={styles.qrActions}>
              <Pressable accessibilityRole='button' disabled={scanningQr} style={styles.qrButton} onPress={scanJournalQr}>
                <LoadingButtonContent loading={scanningQr} label='Učitaj QR iz žurnala' textClassName='font-rubik-medium text-white text-base' />
              </Pressable>
              <Pressable accessibilityRole='button' disabled={scanningQr} style={styles.secondary} onPress={scanScreenshot}>
                <Text style={styles.link}>Učitaj snimak ekrana</Text>
              </Pressable>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => { stopQrScan(); setStep('entry'); setError(''); }}><Text style={styles.link}>Izmeni podatke</Text></Pressable>
              <Pressable onPress={() => { stopQrScan(); setStep('import'); setError(''); }}><Text style={styles.link}>{url ? 'Učitaj račun' : 'Unesi adresu računa'}</Text></Pressable>
              <Pressable onPress={() => { setError(''); webView.current?.reload(); }}><Text style={styles.link}>Osveži stranicu</Text></Pressable>
              <Pressable onPress={openExternal}><Text style={styles.link}>Otvori pregledač</Text></Pressable>
            </View>
          </View>
        ) : (
          <KeyboardAwareScrollView style={styles.scroll} bottomOffset={24} keyboardShouldPersistTaps='handled' contentContainerStyle={styles.form}>
            <Text style={styles.description}>
              {step === 'entry'
                ? 'Prepišite podatke sa računa. Provera se obavlja na zvaničnoj stranici Poreske uprave.'
                : 'Adresa je očitana iz QR koda ili uneta ručno. Pritisnite „Učitaj račun“ za proveru i pregled računa.'}
            </Text>
            {step === 'entry' ? <>
              {fields.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    accessibilityLabel={field.label}
                    style={styles.input}
                    value={draft[field.key]}
                    onChangeText={(value) => { setDraft((previous) => ({ ...previous, [field.key]: value })); setUrl(''); }}
                    placeholder={field.placeholder}
                    placeholderTextColor='#8793a5'
                    autoCorrect={false}
                    autoCapitalize={field.key === 'invoiceNumber' ? 'characters' : 'none'}
                  />
                </View>
              ))}
              <Text style={styles.label}>Oznaka uz brojač računa</Text>
              <Text style={styles.description}>Izaberite oznaku odštampanu uz brojač (npr. PP ili ПП).</Text>
              <View style={styles.suffixes}>
                {Object.entries(COUNTER_SUFFIXES).map(([latin, cyrillic]) => (
                  <Pressable key={latin} accessibilityRole='button' accessibilityState={{ selected: draft.suffix === latin }}
                    style={[styles.suffix, draft.suffix === latin && styles.selectedSuffix]}
                    onPress={() => { setDraft((previous) => ({ ...previous, suffix: latin })); setUrl(''); }}>
                    <Text style={styles.suffixText}>{latin} / {cyrillic}</Text>
                  </Pressable>
                ))}
              </View>
            </> : <>
              <Text style={styles.label}>Adresa računa</Text>
              <TextInput accessibilityLabel='Adresa računa' style={styles.input} value={url} onChangeText={setUrl}
                placeholder='https://suf.purs.gov.rs/v/?vl=…' autoCapitalize='none' autoCorrect={false} multiline editable={!loading} />
            </>}
            {!!error && <Text accessibilityRole='alert' style={styles.error}>{error}</Text>}
            <Pressable style={styles.button} disabled={loading} onPress={step === 'entry' ? verify : importReceipt}>
              <LoadingButtonContent loading={loading} label={step === 'entry' ? 'Proveri na Poreskoj upravi' : 'Učitaj račun'} textClassName='font-rubik-medium text-white text-base' />
            </Pressable>
            <Pressable disabled={loading} style={styles.secondary} onPress={() => { setStep(step === 'entry' ? 'import' : 'entry'); setError(''); }}>
              <Text style={styles.link}>{step === 'entry' ? 'Već imam adresu računa' : 'Nazad na podatke'}</Text>
            </Pressable>
            {step === 'import' && <Pressable disabled={loading} style={styles.secondary} onPress={verify}><Text style={styles.link}>Nazad na proveru</Text></Pressable>}
          </KeyboardAwareScrollView>
        )}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scroll: { flex: 1, minHeight: 0 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontFamily: 'Rubik-SemiBold', fontSize: 20, color: '#18253b', flex: 1 },
  form: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  description: { fontFamily: 'Rubik-Regular', color: '#596579', lineHeight: 22, marginBottom: 18 },
  field: { marginBottom: 18 },
  label: { fontFamily: 'Rubik-Medium', color: '#18253b', marginBottom: 8 },
  input: { fontFamily: 'Rubik-Regular', fontSize: 16, color: '#18253b', backgroundColor: '#f5f7fb', borderColor: '#dce2ec', borderWidth: 1, borderRadius: 12, padding: 14 },
  suffixes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  suffix: { padding: 10, borderWidth: 1, borderColor: '#dce2ec', borderRadius: 10 },
  selectedSuffix: { backgroundColor: '#eaf1ff', borderColor: '#2368fd' },
  suffixText: { fontFamily: 'Rubik-Medium', color: '#18253b' },
  button: { padding: 16, backgroundColor: '#2368fd', borderRadius: 12, marginTop: 12 },
  secondary: { paddingVertical: 16, alignItems: 'center' },
  link: { fontFamily: 'Rubik-Medium', color: '#2368fd', fontSize: 14 },
  error: { fontFamily: 'Rubik-Regular', color: '#b42318', marginVertical: 12, paddingHorizontal: 12 },
  website: { flex: 1, minHeight: 0, overflow: 'hidden' },
  webView: { flex: 1, minHeight: 0 },
  qrActions: { paddingHorizontal: 16, paddingTop: 12 },
  qrButton: { padding: 12, backgroundColor: '#2368fd', borderRadius: 12 },
  notice: { fontFamily: 'Rubik-Regular', color: '#18253b', backgroundColor: '#eaf1ff', padding: 12, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  webLoading: { ...StyleSheet.absoluteFill, backgroundColor: 'white' },
});
