import { useCallback, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BarcodeScanningResult,
  Camera,
  CameraType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

import images from '@/assets/constants/images';
import {
  customAlert,
  getReceiptDataFromTC,
  getSelectedDBName,
} from '@/lib/helpers';
import { useGlobalContext } from '@/lib/global-provider';
import { ReceiptDataFromTC } from '@/lib/types/Receipt';
import ReceiptModal from '@/components/modals/ReceiptModal';
import ReceiptsListDrawer from '@/components/modals/ReceiptsListDrawer';

export default function Index() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [receiptsVisible, setReceiptsVisible] = useState<boolean>(false);

  const [scanned, setScanned] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [scannedData, setScannedData] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [scannedInvoiceNumber, setScannedInvoiceNumber] = useState<string>('');
  const [scannedReceiptDataFromTC, setScannedReceiptDataFromTC] =
    useState<ReceiptDataFromTC>({
      invoiceNumber: '',
      shopName: '',
      totalAmount: '',
      sdcDateTime: '',
      monospaceContent: '',
    });

  const [cameraPermission, requestPermission] = useCameraPermissions();
  const { user, scannedReceipts, cameraOpen, setCameraOpen } =
    useGlobalContext();

  const processScannedUrl = async (url: string) => {
    if (scanned || isProcessing) return;

    if (url && !url.startsWith('https://suf.purs.gov.rs')) {
      setScanned(true);
      customAlert(
        'Upozorenje!',
        'Molimo Vas skenirajte QR kod sa fiskalnog računa.',
      );
      setTimeout(() => setScanned(false), 1500);
      return;
    }

    if (!url) return;

    setScanned(true);
    setIsProcessing(true);
    setScannedData(url);
    await handleReadBarcode(url);
  };

  async function openCamera() {
    const hasSelectedDB =
      !!user?.selectedDB &&
      Array.isArray(user?.databases) &&
      user.databases.some((d) => d.serialNum === user.selectedDB);

    if (!hasSelectedDB) {
      return customAlert(
        'Upozorenje!',
        'Molimo izaberite bazu za skeniranje pre otvaranja kamere. Odabir baze vrši se u drugom tabu sa ikonicom zupčanika.',
      );
    }

    if (!cameraPermission || cameraPermission.status !== 'granted') {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        return customAlert(
          'Upozorenje!',
          'Aplikacija nema dozvolu za korišćenje kamere. Molimo Vas da omogućite pristup kameri u podešavanjima.',
        );
      }
    }
    setCameraOpen(true);
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const pickImageAndScan = async () => {
    try {
      if (scanned || isProcessing) return;

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return customAlert(
          'Upozorenje!',
          'Aplikacija nema dozvolu za pristup galeriji. Molimo Vas da omogućite pristup u podešavanjima.',
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        quality: 1,
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        return customAlert('Greška!', 'Nije moguće učitati izabranu sliku.');
      }

      const scannedCodes = await Camera.scanFromURLAsync(uri, ['qr'] as any); // iOS: samo QR :contentReference[oaicite:2]{index=2}

      if (!scannedCodes || scannedCodes.length === 0) {
        return customAlert(
          'Upozorenje!',
          'Na izabranoj slici nije pronađen QR kod.',
        );
      }

      const data = (scannedCodes[0] as any)?.data as string | undefined;
      if (!data) {
        return customAlert(
          'Upozorenje!',
          'Na izabranoj slici nije pronađen QR kod.',
        );
      }

      await processScannedUrl(data);
    } catch (e) {
      resetScanFlags();
      customAlert(
        'Greška!',
        'Došlo je do greške prilikom skeniranja QR koda iz slike.',
      );
    }
  };

  const resetScanFlags = () => {
    setScanned(false);
    setIsProcessing(false);
  };

  const handleReadBarcode = async (url: string) => {
    try {
      const response = await fetch(url);
      const htmlText = await response.text();

      const receiptData = getReceiptDataFromTC(htmlText);
      if (!receiptData) {
        return customAlert(
          'Upozorenje!',
          'Došlo je do promene strukture na sajtu poreske uprave. Obratite se korisničkoj podršci',
        );
      }

      setScannedReceiptDataFromTC(receiptData);
      setScannedInvoiceNumber(receiptData.invoiceNumber);
      setShowModal(true);
    } catch (error) {
      resetScanFlags();
      customAlert(
        'Greška!',
        'Greška prilikom parsiranja URL adrese poreske uprave!',
      );
    }
  };

  const handleBarcodeScanned = async (qrCodeResults: BarcodeScanningResult) => {
    await processScannedUrl(qrCodeResults.data);
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        setCameraOpen(false);
        resetScanFlags();
        setShowModal(false);
      };
    }, [setCameraOpen]),
  );

  if (cameraOpen) {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.fullscreenCamera}
          facing={facing}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />

        <AntDesign
          style={styles.closeButton}
          name='close-circle'
          size={28}
          color='white'
          onPress={() => setCameraOpen(false)}
        />
        <MaterialIcons
          style={styles.flipButton}
          name='flip-camera-android'
          size={28}
          color='white'
          onPress={toggleCameraFacing}
        />
        <Pressable
          onPress={pickImageAndScan}
          android_ripple={{ color: 'transparent' }}
          style={styles.galleryButton}
        >
          <Ionicons name='image-outline' size={24} color='black' />
        </Pressable>

        {scannedReceipts && scannedReceipts.length > 0 && (
          <>
            <Pressable
              onPress={() => setReceiptsVisible(true)}
              android_ripple={{ color: 'transparent' }}
              style={styles.showReceiptsButton}
            >
              <Ionicons name='receipt-outline' size={24} color='black' />
            </Pressable>
            <ReceiptsListDrawer
              visible={receiptsVisible}
              onClose={() => setReceiptsVisible(false)}
            />
          </>
        )}

        <View style={styles.scanGuide}>
          <Ionicons name='scan-outline' size={250} color='white' />
          <Text style={styles.scanText}>Skenirajte QR kod</Text>
        </View>

        {showModal && (
          <ReceiptModal
            showModal={showModal}
            setShowModal={(val) => {
              setShowModal(val);
              if (!val) {
                resetScanFlags();
                setScannedData('');
                setScannedInvoiceNumber('');
              }
            }}
            scannedData={scannedData}
            setScannedData={setScannedData}
            setScanned={setScanned}
            setProperScanned={() => {}}
            scannedInvoiceNumber={scannedInvoiceNumber}
            setScannedInvoiceNumber={setScannedInvoiceNumber}
            scannedReceiptDataFromTC={scannedReceiptDataFromTC}
            setScannedReceiptDataFromTC={setScannedReceiptDataFromTC}
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2368fd',
        paddingHorizontal: 20,
      }}
    >
      <Image
        source={images.logo}
        style={{
          width: '100%',
        }}
        resizeMode='contain'
      />

      <Text
        className='font-rubik'
        style={{
          fontSize: 18,
          color: 'white',
          marginBottom: 40,
          textAlign: 'center',
        }}
      >
        Baza za skeniranje:{' '}
        <Text className='font-rubik-medium'>
          {getSelectedDBName(user) || 'Nije izabrana'}
        </Text>
      </Text>

      <TouchableOpacity onPress={openCamera} style={{ alignItems: 'center' }}>
        <Image
          source={images.scan}
          className='rounded-full'
          style={{
            width: 250,
            height: 250,
          }}
          resizeMode='contain'
        />
      </TouchableOpacity>
      <Text
        className='font-rubik'
        style={{
          marginTop: 20,
          fontSize: 18,
          fontWeight: '600',
          color: 'white',
          textAlign: 'center',
        }}
      >
        Kliknite ikonicu iznad kako biste otvorili kameru i započeli skeniranje
        računa
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  fullscreenCamera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderRadius: 20,
    padding: 10,
    color: 'white',
    zIndex: 1,
  },
  flipButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 120,
    right: 20,
    borderRadius: 20,
    padding: 10,
    color: 'white',
    zIndex: 1,
  },
  galleryButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 120,
    left: 20,
    borderRadius: 20,
    padding: 10,
    color: '#2368fd',
    backgroundColor: 'white',
    zIndex: 1,
  },
  showReceiptsButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 160 : 180,
    left: 20,
    borderRadius: 20,
    padding: 10,
    color: '#2368fd',
    backgroundColor: 'white',
    zIndex: 1,
  },

  scanGuide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    position: 'absolute',
  },
});
