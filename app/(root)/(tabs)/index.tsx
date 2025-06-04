import { useState } from 'react';
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
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import images from '@/assets/constants/images';
import { customAlert, getReceiptDataFromTC } from '@/lib/helpers';
import { useGlobalContext } from '@/lib/global-provider';
import { ReceiptDataFromTC } from '@/lib/types/Receipt';
import ReceiptModal from '@/components/modals/ReceiptModal';
import ReceiptsListModal from '@/components/modals/ReceiptsListModal';

export default function Index() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [receiptsVisible, setReceiptsVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [scannedReceipt, setScannedReceipt] = useState<string>('');
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

  const { scannedReceipts } = useGlobalContext();

  async function openCamera() {
    if (!cameraPermission || cameraPermission.status !== 'granted') {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        alert('Camera permission is required to use this feature.');
        return;
      }
    }
    setCameraOpen(true);
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const handleBarcodeScanned = (qrCodeResults: BarcodeScanningResult) => {
    const url = qrCodeResults.data;
    if (url && !url.startsWith('https://suf.purs.gov.rs')) {
      return customAlert(
        'Upozorenje!',
        'Molimo Vas skenirajte QR kod sa fiskalnog računa.'
      );
    }
    setScanned(true);
    setScannedData(url);
  };

  const dismiss = () => {
    setScanned(false);
    setScannedData('');
  };

  const handleReadBarcode = async () => {
    try {
      const url = scannedData;
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

      let preTagContent = htmlText.match(/<pre[^>]*>[\s\S]*?<\/pre>/i)?.[0];

      setScannedReceipt(preTagContent);
      setShowModal(true);
    } catch (error) {
      customAlert(
        'Greška!',
        'Greška prilikom parsiranja URL adrese poreske uprave!'
      );
    }
  };

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

        {scanned && (
          <View style={styles.scannedResult}>
            <TouchableOpacity onPress={handleReadBarcode}>
              <Text style={styles.scannedResultText}>
                Prikaži skenirani račun
              </Text>
            </TouchableOpacity>
            <AntDesign name='close' size={18} color='white' onPress={dismiss} />
          </View>
        )}

        {showModal && (
          <ReceiptModal
            showModal={showModal}
            setShowModal={setShowModal}
            scannedReceipt={scannedReceipt}
            scannedData={scannedData}
            setScannedData={setScannedData}
            setScanned={setScanned}
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
      }}
    >
      <TouchableOpacity onPress={openCamera}>
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
  scannedResult: {
    position: 'absolute',
    bottom: 150,
    alignSelf: 'center',
    backgroundColor: '#2368fd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scannedResultText: {
    color: 'white',
  },
});
