import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function Index() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScanneddata] = useState<string>('');
  const [cameraPermission, requestPermission] = useCameraPermissions();

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
      return alert('Molimo Vas skenirajte QR kod sa fiskalnog računa.');
    }
    setScanned(true);
    setScanneddata(url);
  };

  const handleReadBarcode = async () => {
    try {
      const url = scannedData;
      const response = await fetch(url);
      const htmlText = await response.text();

      const preTagContent = htmlText.match(/<pre[^>]*>([\s\S]*?)<br\/>/i)?.[1];

      if (preTagContent) {
        console.log('Content inside <pre>:', preTagContent.trim());
        alert(preTagContent.trim());
      } else {
        console.log('No <pre> tag found on the page.');
        alert('No <pre> tag found on the page.');
      }
    } catch (error) {
      console.error('Error fetching or parsing the HTML:', error);
      alert('Failed to fetch or parse the page. Please check the URL.');
    }
  };

  if (cameraOpen) {
    return (
      <CameraView
        style={styles.fullscreenCamera}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      >
        <AntDesign
          style={styles.closeButton}
          name='closecircleo'
          size={28}
          color='black'
          onPress={() => setCameraOpen(false)}
        />
        <MaterialIcons
          style={styles.flipButton}
          name='flip-camera-android'
          size={28}
          color='black'
          onPress={toggleCameraFacing}
        />
        <View className='h-screen flex items-center justify-center'>
          <Ionicons name='scan-outline' size={250} color='white' />
          <Text className='text-white absolute text-2xl font-bold'>
            Skenirajte QR kod
          </Text>
        </View>
        {scanned && (
          <TouchableOpacity
            className='relative bottom-60 self-center bg-primary-300 rounded-md px-4 py-2'
            onPress={handleReadBarcode}
          >
            <Text className='text-white'>Prikaži skenirani račun</Text>
          </TouchableOpacity>
        )}
      </CameraView>
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
  },
  flipButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 20,
    padding: 10,
    color: 'white',
  },
});
