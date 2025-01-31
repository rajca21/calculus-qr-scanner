import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { signOut, updatePassword } from 'firebase/auth';

import { useGlobalContext } from '@/lib/global-provider';
import { auth } from '@/lib/firebaseConfig';
import { removeLocalStorage } from '@/lib/localAsyncStorage';
import { customAlert } from '@/lib/helpers';

const Config = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateData = async () => {
    if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
      return customAlert(
        'Upozorenje',
        'Morate uneti lozinku i potvrdu lozinke da biste ažurirali nalog'
      );
    }
    if (newPassword.trim().length < 8 || confirmNewPassword.trim().length < 8) {
      return customAlert('Upozorenje', 'Lozinka mora imati bar 8 karaktera');
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      return customAlert('Greška', 'Potvrdite lozinku');
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        updatePassword(user, newPassword)
          .then(() => {
            customAlert('Obaveštenje', 'Uspešno ažuriran nalog');
            setNewPassword('');
            setConfirmNewPassword('');
          })
          .catch((error) => {
            if (error.code === 'auth/requires-recent-login') {
              customAlert(
                'Upozorenje!',
                'Ova operacija može predstavljati sigurnosni rizik. Molimo Vas, izlogujte se, ulogujte se još jednom i pokušajte ponovo.'
              );
            } else {
              customAlert('Greška!', 'Greška prilikom ažuriranja podataka');
            }
            setNewPassword('');
            setConfirmNewPassword('');
          });
      } else {
        setLoading(false);
        router.replace('/sign-in');
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      customAlert('Greška', 'Greška prilikom ažuriranja podataka');
    }
  };

  const handleLogout = () => {
    signOut(auth);
    removeLocalStorage();
    setUser(null);
    setIsLoggedIn(false);
    router.replace('/sign-in');
  };

  return (
    <SafeAreaView className='bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName='pb-32 px-7 h-screen bg-white'
      >
        <View className='mt-5'>
          <Text className='text-xl font-rubik-bold'>Postavke profila</Text>
        </View>

        <View className='flex flex-col justify-between h-full w-full'>
          <View className='flex flex-col gap-5 mt-5'>
            <View className='flex flex-row items-center border bg-gray-100 border-gray-300 rounded-lg p-4 w-full'>
              <Feather name='mail' size={24} color='black' />
              <TextInput
                placeholder='Email adresa'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={user?.email}
                editable={false}
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
              disabled={loading}
              onPress={handleUpdateData}
              className='bg-transparent border-2 border-primary-500 flex flex-row items-center justify-center rounded-full gap-2 py-2'
            >
              {loading ? (
                <View className='w-full flex items-center justify-center'>
                  <ActivityIndicator size='small' color='#2867d3' />
                </View>
              ) : (
                <Text className='text-lg font-rubik-medium text-center  text-primary-500'>
                  Ažuriraj podatke
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
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
