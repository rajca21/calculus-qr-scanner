import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useGlobalContext } from '@/lib/global-provider';
import { setLocalStorage } from '@/lib/localAsyncStorage';
import { customAlert, hasMaliciousInput } from '@/lib/helpers';
import { login } from '@/lib/calculusWS/auhtenticationServices';

export default function LoginForm({
  setShowLoginForm,
}: {
  setShowLoginForm: (value: React.SetStateAction<boolean>) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setUser, setIsLoggedIn } = useGlobalContext();

  const handleLogin = async () => {
    setError('');

    if (email.trim() === '' || !email) {
      return setError('Unesite E-mail adresu!');
    }
    if (password.trim() === '' || !password) {
      return setError('Unesite lozinku!');
    }
    if (hasMaliciousInput(email) || hasMaliciousInput(password)) return;

    setLoading(true);

    try {
      const user = await login(email, password);

      if (user) {
        if (!user.verified) {
          setLoading(false);
          return customAlert(
            'Upozorenje!',
            'Vaš nalog nije verifikovan. Obratite se korisničkoj podršci'
          );
        }
        setUser(user);
        await setLocalStorage('userDetails', {
          ...user,
        });
        setLoading(false);
        setIsLoggedIn(true);
        router.replace('/(root)/(tabs)');
        setShowLoginForm(false);
      }

      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps='handled'
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={84}
      keyboardOpeningTime={0}
    >
      <View className='flex-1 bg-white'>
        <Text className='text-2xl font-rubik-medium text-center mb-12'>
          Unesite vaše kredencijale
        </Text>

        <View className='flex-1'>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Email */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <Feather name='mail' size={24} color='black' />
              <TextInput
                placeholder='Email adresa'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={email}
                textContentType='emailAddress'
                onChangeText={(text) => setEmail(text)}
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>

            {/* Lozinka */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <Feather name='lock' size={24} color='black' />
              <TextInput
                placeholder='Lozinka'
                secureTextEntry={!showPassword}
                textContentType='oneTimeCode'
                className='px-4 font-rubik border-none outline-none flex-1'
                value={password}
                onChangeText={(text) => setPassword(text)}
              />
              {password.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color='black'
                  />
                </TouchableOpacity>
              )}
            </View>

            {!!error && (
              <Text className='mb-4 text-danger font-rubik-bold text-md'>
                {error}
              </Text>
            )}

            <TouchableOpacity
              disabled={loading}
              onPress={handleLogin}
              className='bg-primary-500 py-3 rounded-lg'
            >
              <View>
                {loading ? (
                  <View className='w-full flex justify-center items-center'>
                    <ActivityIndicator size={'large'} color={'white'} />
                  </View>
                ) : (
                  <Text className='text-lg font-rubik-medium text-center text-white'>
                    Uloguj se
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
