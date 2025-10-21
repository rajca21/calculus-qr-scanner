// components/cards/ReceiptCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import icons from '@/assets/constants/icons';
import { Receipt } from '@/lib/types/Receipt';
import { customAlert } from '@/lib/helpers';
import { useGlobalContext } from '@/lib/global-provider';

export default function ReceiptCard({
  item,
  index,
  onPress,
}: {
  item: Receipt;
  index: number;
  onPress?: () => void; // klik na karticu (expand detalja)
}) {
  const { setScannedReceipts } = useGlobalContext();

  const deleteReceipt = (docId: string) => {
    try {
      setScannedReceipts((prev) => prev.filter((r) => r.docId !== docId));
      customAlert('Obaveštenje', 'Uspešno obrisan račun');
    } catch (e) {
      console.log(e);
      customAlert('Greška', 'Greška prilikom brisanja računa');
    }
  };

  return (
    <View className='flex flex-row w-full items-center justify-between border rounded-md border-gray-100 mb-2 bg-white'>
      {/* Leva zona: klik za expand */}
      <TouchableOpacity
        className='flex-1 flex flex-row items-center gap-3 p-5'
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Text className='text-lg font-rubik-bold'>{index + 1}.</Text>
        <Text className='text-lg font-rubik flex-shrink'>
          {item?.invoiceNumber}
        </Text>
      </TouchableOpacity>

      {/* Desna zona: ikonica + delete */}
      <View className='flex flex-row items-center gap-3 pr-3'>
        <Image source={icons.receipt} className='w-8 h-8' />
        <TouchableOpacity
          onPress={() => deleteReceipt(item.docId)}
          activeOpacity={0.85}
          className='w-11 h-11 rounded-full bg-red-500 items-center justify-center'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name='trash-outline' size={22} color='white' />
        </TouchableOpacity>
      </View>
    </View>
  );
}
