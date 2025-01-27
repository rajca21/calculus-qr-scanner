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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { useGlobalContext } from '@/lib/global-provider';
import { auth } from '../lib/firebaseConfig';
import { setLocalStorage } from '@/lib/localAsyncStorage';
import { customAlert } from '@/lib/helpers';

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

  const router = useRouter();

  const { loading, setLoading, setUser } = useGlobalContext();

  const handleCloseForm = () => {
    Keyboard.dismiss();
    Animated.timing(formTranslateY, {
      toValue: 1000,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setShowLoginForm(false));
  };

  const handleLogin = () => {
    setError('');
    setLoading(true);

    if (email.trim() === '' || !email) {
      setError('Unesite E-mail adresu!');
      return;
    }
    if (password.trim() === '' || !password) {
      setError('Unesite lozinku!');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredentials) => {
        const user = userCredentials.user;
        await setLocalStorage('userDetails', user);
        setUser({
          uid: userCredentials.user.uid,
          email: userCredentials.user.email!,
        });
        router.replace('/(root)/(tabs)');
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-credential') {
          customAlert('Upozorenje!', 'Pogrešni kredencijali!');
        }
      });

    setLoading(false);
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
        {/* Login Form */}
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
          <View>
            <Text className='text-xl font-rubik-medium text-center mb-6'>
              Unesite vaše kredencijale
            </Text>
            <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 mb-4'>
              <Feather name='mail' size={24} color='black' />
              <TextInput
                placeholder='Email adresa'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={email}
                onChangeText={(text) => setEmail(text)}
                keyboardType='email-address'
              />
            </View>

            <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 mb-4'>
              <Feather name='lock' size={24} color='black' />
              <TextInput
                placeholder='Lozinka'
                secureTextEntry
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
                  <ActivityIndicator size={'large'} color={'#2867d3'} />
                ) : (
                  'Uloguj se'
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
