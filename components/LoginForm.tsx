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
import { doc, getDoc } from 'firebase/firestore';

import { useGlobalContext } from '@/lib/global-provider';
import { auth, db } from '../lib/firebaseConfig';
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

  const handleLogin = () => {
    setError('');

    if (email.trim() === '' || !email) {
      return setError('Unesite E-mail adresu!');
    }
    if (password.trim() === '' || !password) {
      return setError('Unesite lozinku!');
    }

    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredentials) => {
        const user = userCredentials.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: userCredentials.user.uid,
            email: userCredentials.user.email!,
            role: userData.role,
          });
          await setLocalStorage('userDetails', {
            ...user,
            role: userData.role,
          });
        } else {
          return customAlert(
            'Upozorenje!',
            'Greška prilikom prikupljanja korisničkih podataka!'
          );
        }
        setLoading(false);
        router.replace('/(root)/(tabs)');
      })
      .catch((error) => {
        setLoading(false);
        if (error.code === 'auth/invalid-credential') {
          customAlert('Upozorenje!', 'Pogrešni kredencijali!');
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
                  <View className='w-full flex justify-center items-center'>
                    <ActivityIndicator size={'large'} color={'white'} />
                  </View>
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
