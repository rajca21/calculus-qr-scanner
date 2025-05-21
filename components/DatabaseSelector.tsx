import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';

import { useGlobalContext } from '@/lib/global-provider';
import { setLocalStorage } from '@/lib/localAsyncStorage';

const DatabaseSelector = () => {
  const { user, setUser } = useGlobalContext();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDB, setSelectedDB] = useState(user.selectedDB);

  const handleSelectDatabase = (database: string) => {
    setSelectedDB(database);
    setUser({
      ...user,
      selectedDB: database,
    });
    setLocalStorage('userDetails', {
      ...user,
      selectedDB: database,
    });
    setModalVisible(false);
  };

  return (
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
            {selectedDB
              ? user.databases.filter((db) => db.serialNum === selectedDB)[0]
                  .name
              : 'Serijski broj baze'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType='slide'
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className='flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]'>
          <View className='bg-white p-4 rounded-lg w-3/4'>
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
              data={user.databases}
              keyExtractor={(item) => item.serialNum}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className='p-2'
                  onPress={() => handleSelectDatabase(item.serialNum)}
                >
                  <Text
                    className={`text-lg font-rubik ${
                      item.serialNum === selectedDB && 'text-primary-500'
                    }`}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DatabaseSelector;
