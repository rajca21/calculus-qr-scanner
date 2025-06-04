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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGlobalContext } from '@/lib/global-provider';
import { customAlert } from '@/lib/helpers';
import { exportReceipts } from '@/lib/calculusWS/receiptServices';
import ReceiptCard from '../cards/ReceiptCard';

export default function ReceiptsListModal({
  receiptsVisible,
  setReceiptsVisible,
}: {
  receiptsVisible: boolean;
  setReceiptsVisible: (value: React.SetStateAction<boolean>) => void;
}) {
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(
    null
  );
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
      setLoading(false);
    }
  };

  const handleCardPress = (receiptId: string) => {
    setExpandedReceiptId((prev) => (prev === receiptId ? null : receiptId));
  };

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={receiptsVisible}
      onRequestClose={() => setReceiptsVisible(false)}
    >
      <SafeAreaView className='flex-1'>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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

            <Text style={styles.title}>Skenirani računi</Text>

            <GestureHandlerRootView className='bg-white h-full'>
              <FlatList
                data={scannedReceipts}
                keyExtractor={(item) => item.docId}
                contentContainerStyle={{ paddingBottom: 100 }}
                className='h-screen mt-5'
                renderItem={({ item, index }) => (
                  <View>
                    <TouchableOpacity
                      onPress={() => handleCardPress(item.docId)}
                    >
                      <ReceiptCard item={item} index={index} />
                    </TouchableOpacity>
                    {expandedReceiptId === item.docId && (
                      <View className='px-4 py-2 bg-gray-50 rounded-lg'>
                        {item?.dataFromTC?.invoiceNumber && (
                          <View>
                            <View className='flex flex-col w-full'>
                              {item?.dataFromTC?.shopName && (
                                <View className='flex flex-row items-center justify-between'>
                                  <Text className='font-rubik-bold'>POS: </Text>
                                  <Text className='font-rubik text-base'>
                                    {item.dataFromTC.shopName}
                                  </Text>
                                </View>
                              )}
                              {item?.dataFromTC?.totalAmount && (
                                <View className='flex flex-row items-center justify-between'>
                                  <Text className='font-rubik-bold'>
                                    Ukupan iznos:{' '}
                                  </Text>
                                  <Text className='font-rubik text-base'>
                                    {item.dataFromTC.totalAmount}
                                  </Text>
                                </View>
                              )}
                              {item?.dataFromTC?.sdcDateTime && (
                                <View className='flex flex-row items-center justify-between'>
                                  <Text className='font-rubik-bold'>
                                    PFR vreme:{' '}
                                  </Text>
                                  <Text className='font-rubik text-base'>
                                    {item.dataFromTC.sdcDateTime}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              />
            </GestureHandlerRootView>
            <TouchableOpacity
              onPress={exportScannedReceipts}
              className='bg-primary-500 w-full p-3 rounded-full mt-2'
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '80%',
  },
  closeModalButton: {
    alignSelf: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -24,
  },
});
