import React, { useCallback, useEffect, useState } from 'react';
import {
  Text,
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';

import icons from '@/assets/constants/icons';
import { ReceiptView } from '@/lib/types/Receipt';
import { customAlert } from '@/lib/helpers';
import { useGlobalContext } from '@/lib/global-provider';
import { db } from '@/lib/firebaseConfig';
import ReceiptsViewModal from '@/components/modals/ReceiptsViewModal';

const Receipts = () => {
  const [receipts, setReceipts] = useState<Array<ReceiptView>>([]);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptView | null>(
    null
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isLoggedIn, user } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    fetchReceipts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  }, []);

  const fetchReceipts = async () => {
    try {
      if (!isLoggedIn) {
        router.replace('/sign-in');
      }

      setLoading(true);
      const q = query(
        collection(db, 'receipts'),
        where('userId', '==', user?.uid),
        where('exported', '==', false)
      );
      const querySnapshot = await getDocs(q);
      setReceipts([]);
      querySnapshot.forEach((doc) => {
        setReceipts((prev) => [
          ...prev,
          {
            docId: doc.id,
            scannedReceipt: doc.data().scannedReceipt,
            url: doc.data().url,
            userId: doc.data().userId,
            exported: doc.data().exported,
            checked: false,
          },
        ]);
      });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      customAlert('Greška', 'Greška prilikom učitavanja računa!');
    }
  };

  const exportReceipts = async () => {};

  return (
    <SafeAreaView className='bg-white h-screen'>
      <View className='p-5'>
        <View className='w-full flex flex-row justify-between items-center'>
          <Text className='text-xl font-rubik-bold'>Skenirani računi</Text>
          <TouchableOpacity
            onPress={exportReceipts}
            className='border-2 border-primary-300  px-2 py-3 rounded-md'
          >
            <Text className='color-primary-300 font-rubik-semibold'>
              Izvezi sve račune
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className='mt-6'>
            <ActivityIndicator size='large' color='#2867d3' />
          </View>
        ) : (
          <FlatList
            data={receipts}
            className='h-screen mt-5'
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2867d3']}
              />
            }
            renderItem={({ item, index }) => (
              <View className='flex flex-row w-full p-5 items-center justify-between border rounded-md border-gray-100 mb-2'>
                <TouchableOpacity
                  className='flex w-[90%] flex-row gap-8 items-center'
                  onPress={() => {
                    setCurrentReceipt(item);
                    setShowModal(true);
                  }}
                >
                  <Text className='text-lg font-rubik-bold'>{index + 1}.</Text>
                  <Text className='text-lg font-rubik'>
                    {new Date(parseInt(item?.docId)).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <Image source={icons.receipt} className='w-8 h-8' />
              </View>
            )}
          />
        )}
      </View>

      {showModal && (
        <ReceiptsViewModal
          showModal={showModal}
          setShowModal={setShowModal}
          scannedReceipt={currentReceipt!.scannedReceipt}
          readOnly={true}
        />
      )}
    </SafeAreaView>
  );
};

export default Receipts;
