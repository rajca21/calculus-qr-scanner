import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { customAlert } from '@/lib/helpers';
import { getLocalStorage } from '@/lib/localAsyncStorage';
import { useGlobalContext } from '@/lib/global-provider';
import { ReceiptDataFromTC } from '@/lib/types/Receipt';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReceiptModalProps {
  showModal: boolean;
  setShowModal: (value: React.SetStateAction<boolean>) => void;
  scannedData: string;
  setScannedData: (value: React.SetStateAction<string>) => void;
  setScanned: (value: React.SetStateAction<boolean>) => void;
  setProperScanned?: (value: React.SetStateAction<boolean>) => void;
  scannedInvoiceNumber: string;
  setScannedInvoiceNumber: (value: React.SetStateAction<string>) => void;
  scannedReceiptDataFromTC?: ReceiptDataFromTC;
  setScannedReceiptDataFromTC?: (
    value: React.SetStateAction<ReceiptDataFromTC>
  ) => void;
}

export default function ReceiptModal({
  showModal,
  setShowModal,
  scannedData,
  setScannedData,
  setScanned,
  setProperScanned,
  scannedInvoiceNumber,
  setScannedInvoiceNumber,
  scannedReceiptDataFromTC,
  setScannedReceiptDataFromTC,
}: ReceiptModalProps) {
  const [loading, setLoading] = useState(false);

  const { scannedReceipts, setScannedReceipts } = useGlobalContext();

  const handleClose = () => {
    setScanned(false);
    setProperScanned(false);
    setScannedData('');
    setShowModal(false);
  };

  const resetState = () => {
    setScanned(false);
    setProperScanned(false);
    setScannedData('');
    setScannedInvoiceNumber('');
    setScannedReceiptDataFromTC({
      invoiceNumber: '',
      shopName: '',
      totalAmount: '',
      sdcDateTime: '',
      monospaceContent: '',
    });
    setShowModal(false);
  };

  const handleCreateReceipt = async () => {
    const docId = Date.now().toString();
    const user = await getLocalStorage('userDetails');

    if (!scannedData || !scannedInvoiceNumber) {
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
      resetState();
      return;
    }

    try {
      setScannedReceipts([
        ...scannedReceipts,
        {
          docId: docId,
          url: scannedData,
          userId: user.uid,
          exported: false,
          invoiceNumber: scannedInvoiceNumber,
          createdAt: new Date(),
          dataFromTC: scannedReceiptDataFromTC,
        },
      ]);

      customAlert('Obaveštenje', 'Uspešno učitan račun.');

      setLoading(false);
      resetState();
      setShowModal(false);
    } catch (error) {
      setLoading(false);
      customAlert('Greška!', 'Greška prilikom učitavanja računa.');
    }
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
          <View className='w-[90%] p-6 mt-6 bg-white rounded-t-lg shadow-md overflow-hidden'>
            <View>
              {scannedData && (
                <View className='flex flex-col w-full'>
                  <Text className='font-rubik-bold text-lg mb-4 text-center'>
                    Račun {scannedInvoiceNumber}
                  </Text>
                  {scannedReceiptDataFromTC?.totalAmount && (
                    <View className='flex flex-row items-center justify-between'>
                      <Text className='font-rubik-bold'>Ukupan iznos: </Text>
                      <Text className='font-rubik text-base'>
                        {scannedReceiptDataFromTC.totalAmount}
                      </Text>
                    </View>
                  )}
                  {scannedReceiptDataFromTC?.sdcDateTime && (
                    <View className='flex flex-row items-center justify-between'>
                      <Text className='font-rubik-bold'>PFR vreme: </Text>
                      <Text className='font-rubik text-base'>
                        {scannedReceiptDataFromTC.sdcDateTime}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          <View className='bg-white w-[90%] mb-6 flex flex-row justify-between rounded-b-lg'>
            <TouchableOpacity
              disabled={loading}
              className='flex-1 w-full bg-gray-200 py-3 rounded-b-lg'
              onPress={handleClose}
            >
              <Text className='text-center text-xl font-semibold'>Zatvori</Text>
            </TouchableOpacity>
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
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
