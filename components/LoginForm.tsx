import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useGlobalContext } from '@/lib/global-provider';
import { setLocalStorage } from '@/lib/localAsyncStorage';
import { hasMaliciousInput } from '@/lib/helpers';
import { login } from '@/lib/calculusWS/auhtenticationServices';

export default function LoginForm({
  formTranslateY,
  setShowLoginForm,
}: {
  formTranslateY: Animated.Value;
  setShowLoginForm: (value: React.SetStateAction<boolean>) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const { setUser } = useGlobalContext();

  const handleCloseForm = () => {
    Keyboard.dismiss();
    Animated.timing(formTranslateY, {
      toValue: 1000,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setShowLoginForm(false));
  };

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

    const user = await login(email, password);
    setUser(user);

    await setLocalStorage('userDetails', {
      ...user,
    });

    setLoading(false);
    router.replace('/(root)/(tabs)');
  };

  return (
    <TouchableWithoutFeedback onPress={handleCloseForm}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <Animated.View
            style={{
              transform: [{ translateY: formTranslateY }],
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: '50%',
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              elevation: 5,
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View>
                  <Text className='text-2xl font-rubik-medium text-center mb-12'>
                    Unesite vaše kredencijale
                  </Text>
                  <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 mb-4'>
                    <Feather name='mail' size={24} color='black' />
                    <TextInput
                      placeholder='Email adresa'
                      className='pl-4 font-rubik border-none outline-none w-full'
                      value={email}
                      textContentType='emailAddress'
                      onChangeText={(text) => setEmail(text)}
                      keyboardType='email-address'
                    />
                  </View>

                  <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 mb-4'>
                    <Feather name='lock' size={24} color='black' />
                    <TextInput
                      placeholder='Lozinka'
                      secureTextEntry
                      textContentType='oneTimeCode'
                      className='pl-4 font-rubik border-none outline-none w-full'
                      value={password}
                      onChangeText={(text) => setPassword(text)}
                    />
                  </View>

                  {error && (
                    <Text className='mb-4 text-danger font-rubik-bold text-md'>
                      {error}
                    </Text>
                  )}
                  <TouchableOpacity
                    disabled={loading}
                    onPress={handleLogin}
                    className='bg-primary-500 py-3 rounded-lg'
                  >
                    <Text className='text-lg font-rubik-medium text-center text-white'>
                      {loading ? (
                        <View className='w-full flex justify-center items-center'>
                          <ActivityIndicator size={'large'} color={'white'} />
                        </View>
                      ) : (
                        'Uloguj se'
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAwareScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}
