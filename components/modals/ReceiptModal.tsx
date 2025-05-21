import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import RenderHtml from 'react-native-render-html';

import { customAlert } from '@/lib/helpers';
import { getLocalStorage } from '@/lib/localAsyncStorage';
import { useGlobalContext } from '@/lib/global-provider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReceiptModal({
  showModal,
  setShowModal,
  scannedReceipt,
  readOnly,
  scannedData,
  setScannedData,
  setScanned,
  scannedInvoiceNumber,
  setScannedInvoiceNumber,
}: {
  showModal: boolean;
  setShowModal: (value: React.SetStateAction<boolean>) => void;
  scannedReceipt: string;
  readOnly: boolean;
  scannedData: string;
  setScannedData: (value: React.SetStateAction<string>) => void;
  setScanned: (value: React.SetStateAction<boolean>) => void;
  scannedInvoiceNumber: string;
  setScannedInvoiceNumber: (value: React.SetStateAction<string>) => void;
}) {
  const [loading, setLoading] = useState(false);

  const { scannedReceipts, setScannedReceipts } = useGlobalContext();

  const handleClose = () => {
    if (!readOnly) {
      setScanned(false);
      setScannedData('');
    }
    setShowModal(false);
  };

  const handleCreateReceipt = async () => {
    const docId = Date.now().toString();
    const user = await getLocalStorage('userDetails');

    if (!scannedReceipt || !scannedData || !scannedInvoiceNumber) {
      return customAlert('Greška!', 'Greška prilikom učitavanja računa!');
    }
    if (!user) {
      return customAlert(
        'Greška!',
        'Greška prilikom učitavanja računa! Ulogujte se kasnije i pokušajte ponovo.'
      );
    }

    if (scannedReceipts.length >= 30) {
      return customAlert(
        'Upozorenje!',
        'Dozvoljeno je učitavanje maksimalno 30 računa odjednom! Izvezite postojeće račune i zatim nastavite učitavanje.'
      );
    }

    setLoading(true);

    const existingReceipt = scannedReceipts.some(
      (receipt) => receipt.invoiceNumber === scannedInvoiceNumber
    );
    if (existingReceipt) {
      customAlert('Obaveštenje', 'Ovaj račun je već učitan!');
      setLoading(false);
      setScanned(false);
      setScannedData('');
      setScannedInvoiceNumber('');
      setShowModal(false);
      return;
    }

    try {
      setScannedReceipts([
        ...scannedReceipts,
        {
          docId: docId,
          scannedReceipt: scannedReceipt,
          url: scannedData,
          userId: user.uid,
          exported: false,
          invoiceNumber: scannedInvoiceNumber,
          createdAt: new Date(),
        },
      ]);

      customAlert('Obaveštenje', 'Uspešno učitan račun.');

      setLoading(false);
      setScanned(false);
      setScannedData('');
      setScannedInvoiceNumber('');
      setShowModal(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      customAlert('Greška!', 'Greška prilikom učitavanja računa.');
    }
  };

  const formatReceiptText = (htmlText: string) => {
    const plainText = htmlText.replace(/<[^>]*>/g, '');
    return plainText.split('\n').filter((line) => line.trim() !== '');
  };

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={showModal}
      onRequestClose={() => {
        setShowModal(!showModal);
      }}
    >
      <SafeAreaView className='flex-1'>
        <View className='flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]'>
          <View className='flex-1 w-[90%] p-6 mt-6 bg-white rounded-t-lg shadow-md overflow-hidden'>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {scannedReceipt && (
                <View style={styles.receiptContainer}>
                  {formatReceiptText(scannedReceipt).map((line, index) => (
                    <Text
                      key={index}
                      style={styles.receiptText}
                      numberOfLines={1}
                      ellipsizeMode='clip'
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
          <View className='bg-white w-[90%] mb-6 flex flex-row justify-between rounded-b-lg'>
            <TouchableOpacity
              disabled={loading}
              className={`flex-1 w-full bg-gray-200 py-3 ${
                readOnly ? 'rounded-b-lg' : 'rounded-bl-lg'
              }`}
              onPress={handleClose}
            >
              <Text className='text-center text-xl font-semibold'>Zatvori</Text>
            </TouchableOpacity>
            {!readOnly && (
              <TouchableOpacity
                onPress={handleCreateReceipt}
                disabled={loading}
                className='flex-1 w-full bg-primary-500 py-3 rounded-br-lg'
              >
                <Text className='text-center text-white text-xl font-semibold'>
                  {loading ? (
                    <View className='w-full flex items-center justify-center'>
                      <ActivityIndicator
                        className='text-center'
                        size={'small'}
                        color={'white'}
                      />
                    </View>
                  ) : (
                    'Učitaj'
                  )}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 8,
  },
  receiptContainer: {
    width: '100%',
  },
  receiptText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: Platform.OS === 'ios' ? 13 : 11,
    marginHorizontal: 'auto',
    letterSpacing: 0.2,
    color: '#000',
    includeFontPadding: false,
  },
});
