import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { doc, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebaseConfig';
import { customAlert } from '@/lib/helpers';
import { getLocalStorage } from '@/lib/localAsyncStorage';

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

    setLoading(true);

    try {
      await setDoc(doc(db, 'receipts', docId), {
        url: scannedData,
        userId: user.uid,
        scannedReceipt,
        exported: false,
        invoiceNumber: scannedInvoiceNumber,
        createdAt: new Date(),
      });

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

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={showModal}
      onRequestClose={() => {
        setShowModal(!showModal);
      }}
    >
      <View className='flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]'>
        <View className='w-[90%] p-6 bg-white rounded-t-lg shadow-md'>
          {scannedReceipt && (
            <RenderHtml contentWidth={1} source={{ html: scannedReceipt }} />
          )}
        </View>
        <View className='bg-white w-[90%] flex flex-row justify-between rounded-b-lg'>
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
    </Modal>
  );
}
