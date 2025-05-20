import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import icons from '@/assets/constants/icons';
import { Receipt } from '@/lib/types/Receipt';
import { customAlert } from '@/lib/helpers';
import { useGlobalContext } from '@/lib/global-provider';

export default function ReceiptCard({
  item,
  index,
}: {
  item: Receipt;
  index: number;
}) {
  const { setScannedReceipts } = useGlobalContext();

  const deleteReceipt = async (docId: string) => {
    try {
      setScannedReceipts((prevReceipts) =>
        prevReceipts.filter((receipt) => receipt.docId !== docId)
      );
      customAlert('Obaveštenje', 'Uspešno obrisan račun');
    } catch (error) {
      console.log(error);
      customAlert('Greška', 'Greška prilikom brisanja računa');
    }
  };

  function RightAction(
    docId: string,
    prog: SharedValue<number>,
    drag: SharedValue<number>
  ) {
    const styleAnimation = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: drag.value + 50 }],
      };
    });

    return (
      <Reanimated.View style={styleAnimation}>
        <TouchableOpacity
          className='flex items-center justify-center h-full'
          onPress={() => deleteReceipt(docId)}
        >
          <View className='h-[63%] bg-red-500 rounded-full p-3 ml-4 mb-1.5'>
            <Ionicons name='trash-outline' size={24} color='white' />
          </View>
        </TouchableOpacity>
      </Reanimated.View>
    );
  }

  return (
    <ReanimatedSwipeable
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={(progress, dragX) =>
        RightAction(item.docId, progress, dragX)
      }
    >
      <View className='flex flex-row w-full p-5 items-center justify-between border rounded-md border-gray-100 mb-2'>
        <View className='flex w-[90%] flex-row gap-8 items-center'>
          <Text className='text-lg font-rubik-bold'>{index + 1}.</Text>
          <Text className='text-lg font-rubik'>{item?.invoiceNumber}</Text>
        </View>
        <Image source={icons.receipt} className='w-8 h-8' />
      </View>
    </ReanimatedSwipeable>
  );
}
