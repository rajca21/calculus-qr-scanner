import { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  onDeletePress: () => void;
};

const ConfigHeaderMenu = ({ onDeletePress }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => setOpen((prev) => !prev)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="more-vertical" size={24} color="black" />
      </TouchableOpacity>

      {open && (
        <View className="absolute right-0 mt-8 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <TouchableOpacity
            className="flex-row items-center px-3 py-2"
            onPress={() => {
              setOpen(false);
              onDeletePress();
            }}
          >
            <MaterialCommunityIcons
              name="account-remove-outline"
              size={20}
              color="#dc2626"
            />
            <Text className="ml-2 text-md text-red-600 font-rubik-medium">
              Obriši nalog
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ConfigHeaderMenu;
