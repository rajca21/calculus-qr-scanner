import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGlobalContext } from '@/lib/global-provider';
import { Receipt } from '@/lib/types/Receipt';
import { customAlert } from '@/lib/helpers';
import { exportReceipts } from '@/lib/calculusWS/receiptServices';
import ReceiptCard from '../cards/ReceiptCard';
import ReceiptModal from './ReceiptsViewModal';

export default function ReceiptsListModal({
  receiptsVisible,
  setReceiptsVisible,
}: {
  receiptsVisible: boolean;
  setReceiptsVisible: (value: React.SetStateAction<boolean>) => void;
}) {
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { user, scannedReceipts, setScannedReceipts } = useGlobalContext();

  const exportScannedReceipts = async () => {
    setLoading(true);
    let urls = scannedReceipts
      .map((receipt) => receipt.url)
      .filter((url) => url)
      .join(',');

    if (!urls) {
      return customAlert('Greška', 'Nema računa za učitavanje!');
    }
    if (!user.selectedDB) {
      return customAlert('Greška', 'Nije definisana baza za izvoz!');
    }
    if (!user.sessionToken) {
      return customAlert(
        'Greška',
        'Greška autentikacije. Ulogujte se i pokušajte ponovo.'
      );
    }

    setLoading(true);

    try {
      const res = await exportReceipts(
        user.selectedDB,
        urls,
        user.uid,
        user.sessionToken
      );

      setLoading(false);

      if (res === 'success') {
        customAlert('Obaveštenje', 'Uspešno izvezeni računi');
        setScannedReceipts([]);
        setReceiptsVisible(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={receiptsVisible}
      onRequestClose={() => setReceiptsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View className='bg-white p-2 rounded-tl-3xl rounded-tr-3xl items-center h-[80%]'>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setReceiptsVisible(false)}
          >
            <AntDesign
              name='closecircleo'
              size={24}
              color='black'
              className='m-2'
            />
          </TouchableOpacity>

          <Text className='font-bold text-xl'>Skenirani računi</Text>

          <GestureHandlerRootView className='bg-white h-full'>
            <FlatList
              data={scannedReceipts}
              className='h-screen mt-5'
              renderItem={({ item, index }) => (
                <ReceiptCard
                  item={item}
                  index={index}
                  setCurrentReceipt={setCurrentReceipt}
                  setShowModal={setShowReceiptModal}
                />
              )}
            />
          </GestureHandlerRootView>
          <TouchableOpacity
            onPress={exportScannedReceipts}
            className='mb-10 bg-primary-500 w-full p-3 rounded-full'
          >
            <Text className='text-center text-white font-bold text-lg'>
              {loading ? (
                <View className='w-full flex items-center justify-center'>
                  <ActivityIndicator
                    className='text-center'
                    size={'small'}
                    color={'white'}
                  />
                </View>
              ) : (
                'Izvezi račune'
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {showReceiptModal && (
        <ReceiptModal
          showModal={showReceiptModal}
          setShowModal={setShowReceiptModal}
          scannedReceipt={currentReceipt!.scannedReceipt}
          readOnly={true}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeModalButton: {
    alignSelf: 'flex-end',
  },
});
