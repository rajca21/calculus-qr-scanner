import { View, Text, Modal, TouchableOpacity } from 'react-native';
import RenderHtml from 'react-native-render-html';

export default function ReceiptModal({
  showModal,
  setShowModal,
  scannedReceipt,
  readOnly,
}: {
  showModal: boolean;
  setShowModal: (value: React.SetStateAction<boolean>) => void;
  scannedReceipt: string;
  readOnly: boolean;
}) {
  const handleClose = () => {
    setShowModal(false);
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
        <View className='w-[90%] p-6 bg-white rounded-t-lg shadow-md elevation-sm'>
          {scannedReceipt && (
            <RenderHtml contentWidth={1} source={{ html: scannedReceipt }} />
          )}
        </View>
        <View className='bg-white w-[90%] flex flex-row justify-between rounded-b-lg'>
          <TouchableOpacity
            className={`flex-1 w-full bg-gray-200 py-3 ${
              readOnly ? 'rounded-b-lg' : 'rounded-bl-lg'
            }`}
            onPress={handleClose}
          >
            <Text className='text-center text-xl font-semibold'>Zatvori</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
