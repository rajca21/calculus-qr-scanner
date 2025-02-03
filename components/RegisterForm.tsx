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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { useGlobalContext } from '@/lib/global-provider';
import { auth, db } from '../lib/firebaseConfig';
import { setLocalStorage } from '@/lib/localAsyncStorage';
import { customAlert } from '@/lib/helpers';

export default function RegisterForm({
  formRegTranslateY,
  setShowRegisterForm,
}: {
  formRegTranslateY: Animated.Value;
  setShowRegisterForm: (value: React.SetStateAction<boolean>) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const { setUser } = useGlobalContext();

  const handleCloseForm = () => {
    Keyboard.dismiss();
    Animated.timing(formRegTranslateY, {
      toValue: 1000,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setShowRegisterForm(false));
  };

  const handleRegister = () => {
    setError('');

    if (email.trim() === '' || !email) {
      return setError('Unesite E-mail adresu!');
    }
    if (password.trim() === '' || !password) {
      return setError('Unesite lozinku!');
    }
    if (confirmPassword.trim() === '' || !confirmPassword) {
      return setError('Potvrdite lozinku!');
    }
    if (password.trim().length < 8) {
      return setError('Lozinka mora sadržati bar 8 karaktera!');
    }
    if (password.trim() !== confirmPassword.trim()) {
      return setError('Lozinke se ne slažu!');
    }

    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredentials) => {
        const user = userCredentials.user;

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'demo',
          createdAt: new Date(),
        });

        await setLocalStorage('userDetails', {
          ...user,
          role: 'demo',
        });
        setUser({
          uid: userCredentials.user.uid,
          email: userCredentials.user.email!,
          role: 'demo',
        });
        setLoading(false);
        router.replace('/(root)/(tabs)');
      })

      .catch((error) => {
        setLoading(false);
        if (error.code === 'auth/email-already-in-use') {
          customAlert(
            'Upozorenje!',
            'Korisnik sa ovom e-mail adresom već postoji!'
          );
        }
      });
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
        <Animated.View
          style={{
            transform: [{ translateY: formRegTranslateY }],
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

            <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 mb-4'>
              <Feather name='lock' size={24} color='black' />
              <TextInput
                placeholder='Potvrda lozinke'
                secureTextEntry
                className='pl-4 font-rubik border-none outline-none w-full'
                value={confirmPassword}
                onChangeText={(text) => setConfirmPassword(text)}
              />
            </View>

            {error && (
              <Text className='mb-4 text-danger font-rubik-bold text-md'>
                {error}
              </Text>
            )}
            <TouchableOpacity
              disabled={loading}
              onPress={handleRegister}
              className='bg-primary-500 py-3 rounded-lg'
            >
              <Text className='text-lg font-rubik-medium text-center text-white'>
                {loading ? (
                  <View className='w-full flex justify-center items-center'>
                    <ActivityIndicator size={'large'} color={'white'} />
                  </View>
                ) : (
                  'Registruj se'
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}
