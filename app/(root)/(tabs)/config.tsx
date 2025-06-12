import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Feather,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome6,
} from '@expo/vector-icons';
import { router } from 'expo-router';

import { useGlobalContext } from '@/lib/global-provider';
import { removeLocalStorage, setLocalStorage } from '@/lib/localAsyncStorage';
import { customAlert } from '@/lib/helpers';
import {
  logout,
  resetPassword,
  updateProfileInfo,
} from '@/lib/calculusWS/auhtenticationServices';
import DatabaseSelector from '@/components/DatabaseSelector';

const Config = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [contact, setContact] = useState(user?.contact || '');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const res = await logout(user.uid, user.sessionToken);
      if (res === 'success') {
        await removeLocalStorage();
      }
    } catch (error) {
      //
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      router.replace('/sign-in');
    }
  };

  const updateUserInfo = async () => {
    const res = await updateProfileInfo(user.uid, user.sessionToken, contact);
    if (res === 'success') {
      setUser({
        ...user,
        contact: contact,
      });
      await setLocalStorage('userDetails', {
        ...user,
        contact: contact,
      });
      customAlert('Obaveštenje', 'Profil uspešno ažuriran');
    }
    return res;
  };

  const handleUpdateData = async () => {
    setLoading(true);
    let changeArray = [
      contact.trim(),
      currentPassword.trim(),
      newPassword.trim(),
      confirmNewPassword.trim(),
    ];
    let passwordChangeArray = [
      currentPassword.trim(),
      newPassword.trim(),
      confirmNewPassword.trim(),
    ];

    if (changeArray.every((value) => value === '')) {
      return setLoading(false);
    }

    if (passwordChangeArray.every((value) => value === '')) {
      if (contact !== user.contact) {
        await updateUserInfo();
      }
      return setLoading(false);
    }

    if (passwordChangeArray.some((value) => value === '')) {
      customAlert(
        'Greška',
        'Morate popuniti sva polja za lozinku kako biste je uspešno izmenili!'
      );
      return setLoading(false);
    } else {
      if (newPassword !== confirmNewPassword) {
        customAlert('Greška', 'Lozinke se ne poklapaju!');
        return setLoading(false);
      }

      const res = await resetPassword(
        user.uid,
        user.sessionToken,
        currentPassword,
        newPassword
      );

      if (res === 'success') {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        customAlert('Obaveštenje', 'Lozinka uspešno promenjena');
      }

      if (contact !== user.contact) {
        await updateUserInfo();
      }

      setLoading(false);
    }
  };

  return (
    <SafeAreaView className='bg-white flex-1'>
      <View className='relative flex-1'>
        <View className='pb-32 px-7 h-screen bg-white'>
          <View className='mt-5'>
            <Text className='text-xl font-rubik-bold'>Postavke profila</Text>
          </View>

          <View className='flex flex-col justify-between h-full w-full'>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName='flex flex-col gap-5 mt-5'
            >
              {/* Email adresa korisnika - zabranjena promena */}
              <View
                className={`flex flex-row items-center border bg-gray-100 border-gray-300 rounded-lg px-4 w-full ${
                  Platform.OS === 'ios' ? 'py-4' : 'py-1'
                }`}
              >
                <Feather name='mail' size={24} color='black' />
                <TextInput
                  placeholder='Email adresa'
                  className='pl-4 font-rubik border-none outline-none w-full'
                  value={user?.email}
                  editable={false}
                />
              </View>

              {/* Serijski brojevi baze - izbor baze za učitavanje računa */}
              <DatabaseSelector />

              <View className='border-b-gray-300 border-b'></View>

              {/* Naziv firme - zabranjena promena */}
              <View
                className={`flex flex-row items-center border bg-gray-100 border-gray-300 rounded-lg px-4 w-full ${
                  Platform.OS === 'ios' ? 'py-4' : 'py-1'
                }`}
              >
                <MaterialCommunityIcons
                  name='office-building-outline'
                  size={24}
                  color='black'
                />
                <TextInput
                  placeholder='Naziv firme'
                  className='pl-4 font-rubik border-none outline-none w-full'
                  value={user?.companyName}
                  editable={false}
                />
              </View>

              {/* Kontakt telefon / mail */}
              <View
                className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 w-full ${
                  Platform.OS === 'ios' ? 'py-4' : 'py-1'
                }`}
              >
                <FontAwesome6 name='contact-book' size={24} color='black' />
                <TextInput
                  placeholder='Kontakt telefon/email adresa'
                  className='pl-4 font-rubik border-none outline-none w-full'
                  defaultValue={contact}
                  onChangeText={(text) => setContact(text)}
                />
              </View>

              <View className='border-b-gray-300 border-b'></View>

              {/* Potvrda trenutne lozinke */}
              <View
                className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 w-full ${
                  Platform.OS === 'ios' ? 'py-4' : 'py-1'
                }`}
              >
                <Feather name='lock' size={24} color='black' />
                <TextInput
                  placeholder='Trenutna lozinka'
                  secureTextEntry={!showCurrentPassword}
                  className='pl-4 font-rubik border-none outline-none flex-1'
                  defaultValue={currentPassword}
                  onChangeText={(text) => setCurrentPassword(text)}
                />
                {currentPassword.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    <Feather
                      name={showCurrentPassword ? 'eye-off' : 'eye'}
                      size={22}
                      color='black'
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Nova lozinka */}
              <View
                className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 w-full ${
                  Platform.OS === 'ios' ? 'py-4' : 'py-1'
                }`}
              >
                <Feather name='lock' size={24} color='black' />
                <TextInput
                  placeholder='Nova lozinka'
                  secureTextEntry={!showNewPassword}
                  className='pl-4 font-rubik border-none outline-none flex-1'
                  defaultValue={newPassword}
                  onChangeText={(text) => setNewPassword(text)}
                />
                {newPassword.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowNewPassword((prev) => !prev)}
                  >
                    <Feather
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={22}
                      color='black'
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Potvrda nove lozinke */}
              <View
                className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 w-full ${
                  Platform.OS === 'ios' ? 'py-4' : 'py-1 mb-8'
                }`}
              >
                <Feather name='lock' size={24} color='black' />
                <TextInput
                  placeholder='Potvrda lozinke'
                  secureTextEntry={!showConfirmNewPassword}
                  className='pl-4 font-rubik border-none outline-none flex-1'
                  defaultValue={confirmNewPassword}
                  onChangeText={(text) => setConfirmNewPassword(text)}
                />
                {confirmNewPassword.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowConfirmNewPassword((prev) => !prev)}
                  >
                    <Feather
                      name={showConfirmNewPassword ? 'eye-off' : 'eye'}
                      size={22}
                      color='black'
                    />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <View className='flex flex-col gap-5 mb-24 mt-5'>
              <TouchableOpacity
                disabled={loading}
                onPress={handleUpdateData}
                className='bg-transparent border-2 border-primary-500 flex flex-row items-center justify-center rounded-full gap-2 py-2'
              >
                <Text className='text-lg font-rubik-medium text-center  text-primary-500'>
                  Ažuriraj podatke
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading}
                onPress={handleLogout}
                className='bg-danger border-2 border-danger flex flex-row items-center justify-center rounded-full gap-2 py-2'
              >
                <Text className='text-lg font-rubik-medium text-center text-white'>
                  Izloguj se
                </Text>
                <MaterialIcons name='logout' size={20} color='#ffffff' />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {loading && (
          <View className='absolute top-0 left-0 right-0 bottom-0 bg-black-default opacity-50 flex justify-center items-center'>
            <ActivityIndicator size='large' color='#2368fd' />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Config;
