import { useCallback, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BarcodeScanningResult,
  CameraType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import images from '@/assets/constants/images';
import {
  customAlert,
  getReceiptDataFromTC,
  getSelectedDBName,
} from '@/lib/helpers';
import { useGlobalContext } from '@/lib/global-provider';
import { ReceiptDataFromTC } from '@/lib/types/Receipt';
import ReceiptModal from '@/components/modals/ReceiptModal';
import ReceiptsListModal from '@/components/modals/ReceiptsListModal';

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

  async function openCamera() {
    const hasSelectedDB =
      !!user?.selectedDB &&
      Array.isArray(user?.databases) &&
      user.databases.some((d) => d.serialNum === user.selectedDB);

    if (!hasSelectedDB) {
      return customAlert(
        'Upozorenje!',
        'Molimo izaberite bazu za skeniranje pre otvaranja kamere. Odabir baze vrši se u drugom tabu sa ikonicom zupčanika.'
      );
    }

    if (!cameraPermission || cameraPermission.status !== 'granted') {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        return customAlert(
          'Upozorenje!',
          'Aplikacija nema dozvolu za korišćenje kamere. Molimo Vas da omogućite pristup kameri u podešavanjima.'
        );
      }
    }
    setCameraOpen(true);
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

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
          'Došlo je do promene strukture na sajtu poreske uprave. Obratite se korisničkoj podršci'
        );
      }

      setScannedReceiptDataFromTC(receiptData);
      setScannedInvoiceNumber(receiptData.invoiceNumber);
      setShowModal(true);
    } catch (error) {
      resetScanFlags();
      customAlert(
        'Greška!',
        'Greška prilikom parsiranja URL adrese poreske uprave!'
      );
    }
  };

  const handleBarcodeScanned = async (qrCodeResults: BarcodeScanningResult) => {
    if (scanned || isProcessing) return;

    const url = qrCodeResults.data;
    if (url && !url.startsWith('https://suf.purs.gov.rs')) {
      setScanned(true);
      customAlert(
        'Upozorenje!',
        'Molimo Vas skenirajte QR kod sa fiskalnog računa.'
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

  useFocusEffect(
    useCallback(() => {
      return () => {
        setCameraOpen(false);
        resetScanFlags();
        setShowModal(false);
      };
    }, [setCameraOpen])
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

        {/* Overlay elements */}
        <AntDesign
          style={styles.closeButton}
          name='closecircleo'
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

        {scannedReceipts && scannedReceipts.length > 0 && (
          <>
            <Ionicons
              style={styles.showReceiptsButton}
              name='receipt-outline'
              size={24}
              color='black'
              onPress={() => setReceiptsVisible(true)}
            />
            <ReceiptsListModal
              receiptsVisible={receiptsVisible}
              setReceiptsVisible={setReceiptsVisible}
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

      {/* Database info */}
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
  showReceiptsButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 120,
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
