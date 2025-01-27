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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';

import { useGlobalContext } from '@/lib/global-provider';
import { auth } from '@/lib/firebaseConfig';
import { removeLocalStorage } from '@/lib/localAsyncStorage';

const Config = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();

  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleUpdateData = () => {
    //
  };

  const handleLogout = () => {
    signOut(auth);
    removeLocalStorage();
    setUser(null);
    setIsLoggedIn(false);
    router.replace('/sign-in');
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
              <Feather name='mail' size={24} color='black' />
              <TextInput
                placeholder='Email adresa'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={email}
                onChangeText={(text) => setEmail(text)}
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

          <View className='flex flex-col gap-5 mb-24'>
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
