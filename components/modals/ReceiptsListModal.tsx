import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useGlobalContext } from '@/lib/global-provider';
import { Receipt } from '@/lib/types/Receipt';
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

  const { scannedReceipts, setScannedReceipts } = useGlobalContext();

  const exportReceipts = async () => {
    // Calculus WS

    console.log(scannedReceipts);
    setScannedReceipts([]);
    setReceiptsVisible(false);
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
            onPress={exportReceipts}
            className='mb-10 bg-primary-500 w-full p-3 rounded-full'
          >
            <Text className='text-center text-white font-bold text-lg'>
              Učitaj račune
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
