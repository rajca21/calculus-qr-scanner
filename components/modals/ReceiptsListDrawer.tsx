import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

import { useGlobalContext } from '@/lib/global-provider';
import { customAlert } from '@/lib/helpers';
import { exportReceipts } from '@/lib/calculusWS/receiptServices';
import ReceiptCard from '../cards/ReceiptCard';
import BottomDrawer from '@/components/ui/BottomDrawer';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ReceiptsListDrawer({ visible, onClose }: Props) {
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);

  const { user, scannedReceipts, setScannedReceipts } = useGlobalContext();

  const data = useMemo(() => scannedReceipts ?? [], [scannedReceipts]);

  const exportScannedReceipts = async () => {
    setLoading(true);

    try {
      const urls = (scannedReceipts ?? [])
        .map((r) => r.url)
        .filter(Boolean)
        .join(',');

      if (!urls) {
        setLoading(false);
        return customAlert('Greška', 'Nema računa za učitavanje!');
      }
      if (!user?.selectedDB) {
        setLoading(false);
        return customAlert('Greška', 'Nije definisana baza za izvoz!');
      }
      if (!user?.sessionToken) {
        setLoading(false);
        return customAlert(
          'Greška',
          'Greška autentifikacije. Ulogujte se i pokušajte ponovo.'
        );
      }

      const res = await exportReceipts(
        user.selectedDB,
        urls,
        user.uid,
        user.sessionToken
      );

      if (res === 'success') {
        customAlert('Obaveštenje', 'Uspešno izvezeni računi');
        setScannedReceipts([]);
        onClose();
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (receiptId: string) => {
    setExpandedReceiptId((prev) => (prev === receiptId ? null : receiptId));
  };

  return (
    <BottomDrawer visible={visible} onClose={onClose} heightRatio={0.85}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Skenirani računi</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AntDesign name='close-circle' size={22} color='#111827' />
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item, index) => item?.docId ?? String(index)}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          renderItem={({ item, index }) => (
            <View style={{ marginBottom: 8 }}>
              <ReceiptCard
                item={item}
                index={index}
                onPress={() => handleCardPress(item.docId)}
              />

              {expandedReceiptId === item.docId && (
                <View className='px-4 py-2 bg-gray-50 rounded-lg'>
                  {!!item?.dataFromTC?.invoiceNumber && (
                    <View>
                      <View className='flex flex-col w-full'>
                        {!!item?.dataFromTC?.totalAmount && (
                          <View className='flex flex-row items-center justify-between'>
                            <Text className='font-rubik-bold'>
                              Ukupan iznos:{' '}
                            </Text>
                            <Text className='font-rubik text-base'>
                              {item.dataFromTC.totalAmount}
                            </Text>
                          </View>
                        )}
                        {!!item?.dataFromTC?.sdcDateTime && (
                          <View className='flex flex-row items-center justify-between'>
                            <Text className='font-rubik-bold'>PFR vreme: </Text>
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

        <TouchableOpacity
          onPress={exportScannedReceipts}
          disabled={loading}
          className='bg-primary-500 w-full p-3 rounded-full mt-2'
          style={{ marginBottom: Platform.OS === 'ios' ? 8 : 36 }}
          activeOpacity={0.85}
        >
          <Text className='text-center text-white font-bold text-lg'>
            {loading ? (
              <ActivityIndicator size='small' color='white' />
            ) : (
              'Izvezi račune'
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomDrawer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 8,
    top: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
});
