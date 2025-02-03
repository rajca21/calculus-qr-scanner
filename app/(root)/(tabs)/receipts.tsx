import React, { useCallback, useEffect, useState } from 'react';
import {
  Text,
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { ReceiptView } from '@/lib/types/Receipt';
import { customAlert } from '@/lib/helpers';
import { useGlobalContext } from '@/lib/global-provider';
import { db, storage } from '@/lib/firebaseConfig';
import ReceiptsViewModal from '@/components/modals/ReceiptsViewModal';
import ReceiptCard from '@/components/cards/ReceiptCard';

const Receipts = () => {
  const [receipts, setReceipts] = useState<Array<ReceiptView>>([]);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptView | null>(
    null
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isLoggedIn, setIsLoggedIn, user, setUser } = useGlobalContext();
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
            invoiceNumber: doc.data().invoiceNumber,
            checked: false,
          },
        ]);
      });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      customAlert(
        'Greška',
        'Greška prilikom učitavanja računa! Molimo ulogujte se ponovo.'
      );
      setIsLoggedIn(false);
      setUser(null);
      router.replace('/sign-in');
    }
  };

  const exportReceipts = async () => {
    if (!isLoggedIn || !user) {
      router.replace('/sign-in');
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const fileName = `${user?.email}-${today}.txt`;
      const fileRef = ref(storage, fileName);

      let existingContent = '';

      try {
        const fileUrl = await getDownloadURL(fileRef);
        const response = await fetch(fileUrl);
        existingContent = await response.text();
      } catch (error) {
        //
      }

      const newReceipts = receipts.map((receipt) => receipt.url).join('\n');
      const updatedContent = existingContent
        ? `${existingContent}\n${newReceipts}`
        : newReceipts;

      const blob = new Blob([updatedContent], { type: 'text/plain' });
      await uploadBytes(fileRef, blob);

      const updatePromises = receipts.map(async (receipt) => {
        const receiptRef = doc(db, 'receipts', receipt.docId);
        return updateDoc(receiptRef, { exported: true });
      });

      await Promise.all(updatePromises);

      customAlert('Obaveštenje', 'Uspešno izvezeni računi.');
      setLoading(false);
      fetchReceipts();
    } catch (error) {
      console.log(error);
      setLoading(false);
      customAlert('Greška', 'Greška prilikom eksportovanja računa!');
    }
  };

  return (
    <GestureHandlerRootView className='bg-white h-screen'>
      <SafeAreaView className='bg-white h-screen'>
        <View className='p-5'>
          <View className='w-full flex flex-row justify-between items-center'>
            <Text className='text-xl font-rubik-bold'>Skenirani računi</Text>

            {receipts && receipts.length > 0 && (
              <TouchableOpacity
                onPress={exportReceipts}
                className='border-2 border-primary-300  px-2 py-3 rounded-md'
              >
                <Text className='color-primary-300 font-rubik-semibold'>
                  Izvezi sve račune
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!loading && receipts && receipts.length <= 0 && (
            <Text className='font-rubik text-xl mt-5'>
              Nemate skeniranih računa
            </Text>
          )}

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
                <ReceiptCard
                  item={item}
                  index={index}
                  setCurrentReceipt={setCurrentReceipt}
                  setShowModal={setShowModal}
                  fetchReceipts={fetchReceipts}
                />
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
    </GestureHandlerRootView>
  );
};

export default Receipts;
