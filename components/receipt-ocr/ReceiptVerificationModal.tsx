import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import WebView from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import LoadingButtonContent from '@/components/ui/LoadingButtonContent';
import {
  buildVerificationScript, COUNTER_SUFFIXES, isOfficialPage, isOfficialReceiptUrl,
  ReceiptVerificationDraft, getVerificationErrors, maskReceiptDate, VERIFICATION_PAGE,
} from '@/lib/receipt-verification';
import { buildJournalQrScript, decodeJournalQr } from '@/lib/journal-qr';
import { isReceiptOcrAvailable, recognizeReceipt } from '@/modules/receipt-ocr';
import { parseReceipt } from '@/lib/receipt-ocr/parseReceipt';
import { File, Paths } from 'expo-file-system';

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
    invoiceNumber: '', counter: '', suffix: 'PP', totalAmount: '', dateTime: '',
  });
  const [step, setStep] = useState<'entry' | 'website'>('entry');
  const [error, setError] = useState('');
  const [resultVisible, setResultVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [suffixVisible, setSuffixVisible] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof ReceiptVerificationDraft, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const prefilled = useRef(false);
  const verifiedDraft = useRef<ReceiptVerificationDraft | null>(null);
  const fieldErrors = getVerificationErrors(draft);
  const inputs = useRef<Partial<Record<keyof ReceiptVerificationDraft, TextInput>>>({});
  const [loading, setLoading] = useState(false);
  const [scanningQr, setScanningQr] = useState(false);
  const [readingReceipt, setReadingReceipt] = useState(false);
  const [receiptPhoto, setReceiptPhoto] = useState('');
  const [ocrNotice, setOcrNotice] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const ocrRequest = useRef(0);
  const photoRef = useRef('');
  const capturing = useRef(false);
  const webView = useRef<WebView>(null);
  const importing = useRef(false);
  const qrRequest = useRef(0);
  const qrTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const removePhoto = (uri: string) => {
    // Only delete picker-created cache copies, never original gallery files.
    if (uri && uri.startsWith(Paths.cache.uri)) {
      try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* Cache cleanup can be retried by the OS. */ }
    }
  };

  const readReceiptPhoto = async (source: 'camera' | 'gallery') => {
    if (capturing.current) return;
    if (!isReceiptOcrAvailable()) {
      setError('OCR zahteva novu instalaciju aplikacije sa OCR podrškom. Ručni unos je i dalje dostupan.');
      return;
    }
    const requestId = ++ocrRequest.current;
    capturing.current = true;
    setReadingReceipt(true);
    setError('');
    let pendingPhoto = '';
    try {
      Keyboard.dismiss();
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Omogućite pristup kameri u podešavanjima telefona ili izaberite sliku iz galerije.');
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'], quality: 1, allowsMultipleSelection: false,
        // Do not force a square crop: all receipt verification fields must be visible.
        allowsEditing: false,
      };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      pendingPhoto = result.assets[0].uri;
      if (!mounted.current || requestId !== ocrRequest.current) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const recognized = await Promise.race([
        recognizeReceipt(pendingPhoto),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('OCR timeout')), 30000);
        }),
      ]).finally(() => { if (timer) clearTimeout(timer); });
      if (!mounted.current || requestId !== ocrRequest.current) return;
      const parsed = parseReceipt(recognized.lines);
      removePhoto(photoRef.current);
      photoRef.current = pendingPhoto;
      setReceiptPhoto(pendingPhoto);
      pendingPhoto = '';
      // A new photograph replaces the entire draft to avoid mixing receipts.
      setDraft({ ...parsed.draft, suffix: parsed.draft.suffix || 'PP', dateTime: maskReceiptDate(parsed.draft.dateTime) });
      setTouched({});
      setSubmitted(false);
      setMissingFields(parsed.missing);
      setOcrNotice(parsed.missing.length
        ? 'Proverite prepoznate podatke i dopunite označena polja. Ako tekst nije jasan, fotografišite ponovo.'
        : 'Podaci su prepoznati. Uporedite sva polja sa fotografijom pre provere na Poreskoj upravi.');
      if (parsed.ambiguous.length) setOcrNotice('Pronađeni su različiti podaci. Fotografija treba da prikazuje samo jedan račun. Dopunite označena polja.');
    } catch {
      if (mounted.current && requestId === ocrRequest.current)
        setError('Račun nije pročitan. Proverite dozvolu za kameru, fotografišite jasnije ili unesite podatke ručno.');
    } finally {
      removePhoto(pendingPhoto);
      capturing.current = false;
      if (mounted.current && requestId === ocrRequest.current) setReadingReceipt(false);
    }
  };

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
      removePhoto(photoRef.current);
    };
  }, []);

  const acceptQrUrl = async (value: string) => {
    if (importing.current || !isOfficialReceiptUrl(value)) return;
    stopQrScan();
    importing.current = true;
    setLoading(true);
    setError('');
    try {
      const imported = await onImport(value, verifiedDraft.current ?? draft);
      if (!mounted.current) return;
      if (imported) onClose();
      else setError('Račun nije učitan. Proverite podatke i pokušajte ponovo.');
    } catch {
      if (mounted.current) setError('Račun nije učitan. Proverite internet vezu i pokušajte ponovo.');
    } finally {
      importing.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const scanJournalQr = () => {
    if (scanningQr || importing.current) return;
    const requestId = ++qrRequest.current;
    setScanningQr(true);
    setError('');
    qrTimeout.current = setTimeout(() => {
      if (!mounted.current || requestId !== qrRequest.current) return;
      stopQrScan();
      setError('QR kod nije pročitan. Otvorite Žurnal, pomerite se do QR koda i pokušajte ponovo.');
    }, 60000);
    webView.current?.injectJavaScript(buildJournalQrScript(requestId));
  };

  const verify = () => {
    setSubmitted(true);
    if (Object.keys(fieldErrors).length) {
      const firstInvalid = fields.find((field) => fieldErrors[field.key]);
      if (firstInvalid) inputs.current[firstInvalid.key]?.focus();
      return;
    }
    Keyboard.dismiss();
    setError('');
    prefilled.current = false;
    verifiedDraft.current = null;
    setResultVisible(false);
    setStep('website');
  };

  return (
    <Modal visible animationType='slide' presentationStyle='fullScreen' statusBarTranslucent navigationBarTranslucent
      onRequestClose={() => { if (!loading && !readingReceipt) onClose(); }}>
      <SafeAreaProvider style={styles.container}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.header}>
            <Text style={styles.title}>OCR skener računa</Text>
            <Pressable accessibilityRole='button' accessibilityLabel='Zatvori OCR skener' disabled={loading || readingReceipt}
              onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <AntDesign name='close-circle' size={28} color='#18253b' />
            </Pressable>
          </View>
          {step === 'website' ? (
            <View style={styles.website}>
              <Text accessibilityLiveRegion='polite' style={styles.notice}>
                {resultVisible
                  ? 'Otvorite Žurnal, pomerite se do dela gde je QR kod vidljiv i kliknite na dugme Učitaj QR iz žurnala.'
                  : 'Proverite i popunite polja koja nisu uneta. Nakon toga kliknite na dugme Pošalji.'}
              </Text>
              {!!error && <Text accessibilityRole='alert' style={styles.error}>{error}</Text>}
              <WebView
                ref={webView}
                style={styles.webView}
                containerStyle={styles.webView}
                source={{ uri: VERIFICATION_PAGE }}
                originWhitelist={['https://*']}
                javaScriptEnabled
                setSupportMultipleWindows={false}
                onShouldStartLoadWithRequest={(request) => request.isTopFrame === false || isOfficialPage(request.url)}
                onLoadEnd={() => webView.current?.injectJavaScript(buildVerificationScript(draft, !prefilled.current))}
                onLoadStart={() => { stopQrScan(); setError(''); }}
                onMessage={(event) => {
                  if (!mounted.current || !isOfficialPage(event.nativeEvent.url) || event.nativeEvent.data.length > 1500000) return;
                  try {
                    const message: unknown = JSON.parse(event.nativeEvent.data);
                    if (!message || typeof message !== 'object' || !('type' in message)) return;
                    if ('requestId' in message && message.requestId === qrRequest.current && !importing.current) {
                      if (message.type === 'journal-qr-not-found') {
                        stopQrScan();
                        setError('QR kod nije pronađen. Otvorite Žurnal, pomerite se do QR koda i pokušajte ponovo.');
                      }
                      if (message.type === 'journal-qr-pixels') {
                        const recovered = decodeJournalQr(message);
                        webView.current?.injectJavaScript(`window.__calculusQrReply && window.__calculusQrReply(${qrRequest.current}, ${!!recovered}); true;`);
                        if (recovered) void acceptQrUrl(recovered);
                      }
                    }
                    if (message.type === 'prefilled' || message.type === 'unsupported') prefilled.current = true;
                    if (message.type === 'verification-page' && 'stage' in message) {
                      if (message.stage === 'result') {
                        setResultVisible(true);
                        // Use corrected official result values when the user edits TaxCore fields.
                        if ('invoiceNumber' in message && typeof message.invoiceNumber === 'string' &&
                            'totalAmount' in message && typeof message.totalAmount === 'string') {
                          verifiedDraft.current = { ...draft, invoiceNumber: message.invoiceNumber, totalAmount: message.totalAmount };
                        }
                      }
                      if (message.stage === 'form') { setResultVisible(false); verifiedDraft.current = null; }
                    }
                  } catch { /* Ignore unrelated/malformed messages from page scripts. */ }
                }}
                onError={() => setError('Stranica nije dostupna. Proverite internet vezu i ponovo otvorite proveru.')}
                onHttpError={() => setError('Poreska uprava nije vratila stranicu. Pokušajte ponovo kasnije.')}
                startInLoadingState
                renderLoading={() => <ActivityIndicator style={styles.webLoading} size='small' color='#2368fd' />}
              />
              {resultVisible && <View style={styles.qrActions}>
                <Pressable accessibilityRole='button' disabled={scanningQr || loading} style={styles.qrButton} onPress={scanJournalQr}>
                  <LoadingButtonContent loading={scanningQr || loading} label='Učitaj QR iz žurnala' textClassName='font-rubik-medium text-white text-base' />
                </Pressable>
              </View>}
            </View>
          ) : (
            <KeyboardAwareScrollView style={styles.scroll} bottomOffset={24} keyboardShouldPersistTaps='handled' contentContainerStyle={styles.form}>
              <View style={styles.captureActions}>
                <Pressable accessibilityRole='button' accessibilityLabel='Uputstvo za OCR' accessibilityState={{ expanded: infoVisible }}
                  style={[styles.iconButton, infoVisible && styles.selectedSuffix]} onPress={() => setInfoVisible((value) => !value)}>
                  <Ionicons name='information-circle-outline' size={28} color='#2368fd' />
                </Pressable>
                <Pressable accessibilityRole='button' accessibilityLabel='Fotografiši račun' disabled={readingReceipt}
                  style={styles.iconButton} onPress={() => readReceiptPhoto('camera')}>
                  <Ionicons name='camera-outline' size={28} color='#2368fd' />
                </Pressable>
                <Pressable accessibilityRole='button' accessibilityLabel='Izaberi sliku računa' disabled={readingReceipt}
                  style={styles.iconButton} onPress={() => readReceiptPhoto('gallery')}>
                  <Ionicons name='image-outline' size={28} color='#2368fd' />
                </Pressable>
              </View>
              {infoVisible && <Text style={styles.instructions}>
                Fotografišite ili ubacite sliku fiskalnog računa na kojoj su vidljivi PFR broj računa, brojač računa, datum i vreme i ukupan iznos računa. Sistem za prepoznavanje teksta će pokušati da prepozna vrednosti sa računa i unese ih u polja ispod. Polja koja ne prepozna ili prepozna pogrešno unesite ručno ili ih prepravite. Nakon unosa svih polja možete preći na stranicu Poreske uprave za prepoznavanje računa. Pratite uputstva sa ekrana nakon toga.
              </Text>}
              {readingReceipt && <View style={styles.reading} accessibilityLiveRegion='polite'>
                <ActivityIndicator size='small' color='#2368fd' /><Text style={styles.label}>Čitanje računa…</Text>
              </View>}
              {!!receiptPhoto && <Image accessibilityLabel='Fotografija računa za proveru prepoznatih podataka' source={{ uri: receiptPhoto }} style={styles.receiptPhoto} resizeMode='contain' />}
              {!!ocrNotice && <Text accessibilityLiveRegion='polite' style={styles.ocrNotice}>{ocrNotice}</Text>}
              {fields.map((field) => {
                const warning = (submitted || touched[field.key]) && fieldErrors[field.key];
                return <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    ref={(input) => { if (input) inputs.current[field.key] = input; }}
                    accessibilityLabel={field.label}
                    accessibilityHint={warning || (field.key === 'dateTime' ? 'DD.MM.GGGG. HH:mm:ss' : undefined)}
                    style={[styles.input, missingFields.includes(field.key) && !draft[field.key] && styles.missingInput, !!warning && styles.invalidInput]}
                    value={draft[field.key]}
                    onChangeText={(value) => setDraft((previous) => ({ ...previous, [field.key]: field.key === 'dateTime' ? maskReceiptDate(value) : value }))}
                    onBlur={() => setTouched((previous) => ({ ...previous, [field.key]: true }))}
                    placeholder={field.key === 'dateTime' ? 'DD.MM.GGGG. HH:mm:ss' : field.placeholder}
                    placeholderTextColor='#8793a5'
                    keyboardType={field.key === 'dateTime' ? 'number-pad' : field.key === 'totalAmount' ? 'decimal-pad' : 'default'}
                    autoCorrect={false}
                    editable={!readingReceipt}
                    autoCapitalize={field.key === 'invoiceNumber' ? 'characters' : 'none'}
                  />
                  {!!warning && <Text accessibilityRole='alert' style={styles.fieldError}>{warning}</Text>}
                </View>;
              })}
              <Text style={styles.label}>Oznaka uz brojač računa</Text>
              <Pressable accessibilityRole='button' accessibilityLabel={`Oznaka uz brojač računa: ${draft.suffix}`}
                accessibilityState={{ expanded: suffixVisible }} disabled={readingReceipt}
                style={[styles.input, styles.select]} onPress={() => setSuffixVisible((value) => !value)}>
                <Text style={styles.suffixText}>{draft.suffix}</Text>
                <Ionicons name={suffixVisible ? 'chevron-up' : 'chevron-down'} size={20} color='#596579' />
              </Pressable>
              {suffixVisible && <View style={styles.suffixes}>
                {Object.entries(COUNTER_SUFFIXES).map(([latin, cyrillic]) => (
                  <Pressable key={latin} accessibilityRole='button' accessibilityState={{ selected: draft.suffix === latin }}
                    style={[styles.suffix, draft.suffix === latin && styles.selectedSuffix]} disabled={readingReceipt}
                    onPress={() => { setDraft((previous) => ({ ...previous, suffix: latin })); setSuffixVisible(false); }}>
                    <Text style={styles.suffixText}>{latin} / {cyrillic}</Text>
                    {draft.suffix === latin && <Ionicons name='checkmark' size={20} color='#2368fd' />}
                  </Pressable>
                ))}
              </View>}
              {submitted && !!fieldErrors.suffix && <Text accessibilityRole='alert' style={styles.fieldError}>{fieldErrors.suffix}</Text>}
              {!!error && <Text accessibilityRole='alert' style={styles.error}>{error}</Text>}
              <Pressable accessibilityRole='button' style={styles.button} disabled={readingReceipt} onPress={verify}>
                <LoadingButtonContent loading={false} label='Proveri na Poreskoj upravi' textClassName='font-rubik-medium text-white text-base' />
              </Pressable>
            </KeyboardAwareScrollView>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  captureActions: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  iconButton: { width: 56, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: '#f5f7fb', borderWidth: 1, borderColor: '#dce2ec' },
  instructions: { fontFamily: 'Rubik-Regular', color: '#596579', lineHeight: 22, padding: 16, backgroundColor: '#f5f7fb', borderRadius: 12, marginBottom: 20 },
  reading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 12 },
  receiptPhoto: { width: '100%', height: 240, backgroundColor: '#f5f7fb', borderRadius: 12, marginBottom: 16 },
  ocrNotice: { fontFamily: 'Rubik-Regular', color: '#18253b', padding: 12, backgroundColor: '#eaf1ff', borderRadius: 12, marginBottom: 18, lineHeight: 22 },
  missingInput: { borderColor: '#d29c38' },
  invalidInput: { borderColor: '#b42318' },
  scroll: { flex: 1, minHeight: 0 },
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  closeButton: { paddingVertical: 8 },
  title: { fontFamily: 'Rubik-SemiBold', fontSize: 20, color: '#18253b', flex: 1 },
  form: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  field: { marginBottom: 18 },
  label: { fontFamily: 'Rubik-Medium', color: '#18253b', marginBottom: 8 },
  input: { fontFamily: 'Rubik-Regular', fontSize: 16, color: '#18253b', backgroundColor: '#f5f7fb', borderColor: '#dce2ec', borderWidth: 1, borderRadius: 12, padding: 14 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suffixes: { borderWidth: 1, borderColor: '#dce2ec', borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  suffix: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedSuffix: { backgroundColor: '#eaf1ff', borderColor: '#2368fd' },
  suffixText: { fontFamily: 'Rubik-Medium', color: '#18253b' },
  button: { padding: 16, backgroundColor: '#2368fd', borderRadius: 12, marginTop: 20 },
  fieldError: { fontFamily: 'Rubik-Regular', color: '#b42318', marginTop: 6, lineHeight: 20 },
  error: { fontFamily: 'Rubik-Regular', color: '#b42318', marginVertical: 12, paddingHorizontal: 12 },
  website: { flex: 1, minHeight: 0, overflow: 'hidden' },
  webView: { flex: 1, minHeight: 0 },
  qrActions: { paddingHorizontal: 16, paddingVertical: 10 },
  qrButton: { padding: 12, backgroundColor: '#2368fd', borderRadius: 12 },
  notice: { fontFamily: 'Rubik-Regular', color: '#18253b', backgroundColor: '#eaf1ff', padding: 12, lineHeight: 20 },
  webLoading: { ...StyleSheet.absoluteFill, backgroundColor: 'white' },
});
