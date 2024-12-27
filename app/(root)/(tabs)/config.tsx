import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useGlobalContext } from '@/lib/global-provider';

const Config = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();

  const [username, setUsername] = useState(user?.username || '');
  const [pib, setPib] = useState(user?.pib || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleUpdateData = () => {
    setUser({ $id: user?.$id || '', username, pib });
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <SafeAreaView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName='pb-32 px-7 h-screen bg-white'
      >
        <View className='mt-5'>
          <Text className='text-xl font-rubik-bold'>Postavke profila</Text>
        </View>

        <View className='flex flex-col justify-between h-full w-full'>
          <View className='flex flex-col gap-5 mt-5'>
            <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 w-full'>
              <Feather name='user' size={24} color='black' />
              <TextInput
                placeholder='Korisničko ime'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={username}
                onChangeText={(text) => setUsername(text)}
              />
            </View>

            <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 w-full'>
              <FontAwesome name='building-o' size={24} color='black' />
              <TextInput
                placeholder='PIB'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={pib}
                onChangeText={(text) => setPib(text)}
              />
            </View>

            <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 w-full'>
              <Feather name='lock' size={24} color='black' />
              <TextInput
                placeholder='Nova lozinka'
                secureTextEntry
                className='pl-4 font-rubik border-none outline-none w-full'
                defaultValue={newPassword}
                onChangeText={(text) => setNewPassword(text)}
              />
            </View>

            <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 w-full'>
              <Feather name='lock' size={24} color='black' />
              <TextInput
                placeholder='Potvrda lozinke'
                secureTextEntry
                className='pl-4 font-rubik border-none outline-none w-full'
                defaultValue={confirmNewPassword}
                onChangeText={(text) => setConfirmNewPassword(text)}
              />
            </View>
          </View>

          <View className='flex flex-col gap-5 mb-5'>
            <TouchableOpacity
              disabled={false}
              onPress={handleUpdateData}
              className='bg-transparent border-2 border-primary-500 flex flex-row items-center justify-center rounded-full gap-2 py-2'
            >
              <Text className='text-lg font-rubik-medium text-center  text-primary-500'>
                Ažuriraj podatke
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={false}
              onPress={handleLogout}
              className='bg-danger border-2 border-danger flex flex-row items-center justify-center rounded-full gap-2 py-2'
            >
              <Text className='text-lg font-rubik-medium text-center  text-white'>
                Izloguj se
              </Text>
              <MaterialIcons name='logout' size={20} color='#ffffff' />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Config;
