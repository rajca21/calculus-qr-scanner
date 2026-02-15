import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';

import { useGlobalContext } from '@/lib/global-provider';
import { setLocalStorage } from '@/lib/localAsyncStorage';

type Props = {
  variant?: 'default' | 'compact';
};

const DatabaseSelector = ({ variant = 'default' }: Props) => {
  const { user, setUser } = useGlobalContext();
  const [isModalVisible, setModalVisible] = useState(false);

  if (!user) return null;

  const databases = user.databases ?? [];
  const selectedDB = user.selectedDB ?? null;

  const selectedName = useMemo(() => {
    if (!selectedDB) return null;
    const found = databases.find((db) => db.serialNum === selectedDB);
    return found?.name ?? null;
  }, [databases, selectedDB]);

  const handleSelectDatabase = async (database: string) => {
    const nextUser = { ...user, selectedDB: database };
    setUser(nextUser);
    await setLocalStorage('userDetails', nextUser);
    setModalVisible(false);
  };

  const label = selectedName ?? 'Nije izabrana';

  const isCompact = variant === 'compact';

  return (
    <>
      {isCompact ? (
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text className='font-rubik-bold text-white' style={{ fontSize: 18 }}>
            {label}
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TouchableOpacity
            className='flex flex-row items-center border border-gray-300 rounded-lg p-4 w-full'
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons
              name='database-arrow-left-outline'
              size={24}
              color='black'
            />
            <View className='pl-4 w-full'>
              <Text className='font-rubik'>
                {selectedName ?? 'Serijski broj baze'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        transparent
        animationType='slide'
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className='flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]'>
          <View className='bg-white p-4 rounded-lg w-3/4 max-h-[70%]'>
            <View className='flex flex-row justify-between items-start'>
              <Text className='text-lg font-rubik-medium mb-2'>
                Odaberite bazu za uvoz
              </Text>
              <AntDesign
                onPress={() => setModalVisible(false)}
                name='close'
                size={24}
                color='black'
              />
            </View>

            <FlatList
              data={databases}
              keyExtractor={(item) => item.serialNum}
              renderItem={({ item }) => {
                const active = item.serialNum === selectedDB;
                return (
                  <TouchableOpacity
                    className={`p-2 rounded-md ${active ? 'bg-gray-100' : ''}`}
                    onPress={() => handleSelectDatabase(item.serialNum)}
                  >
                    <Text
                      className={`text-lg font-rubik ${
                        active ? 'text-primary-500' : ''
                      }`}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text className='font-rubik text-red-600'>
                  Nema dostupnih baza.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DatabaseSelector;
