import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

import images from '@/assets/constants/images';
import { useGlobalContext } from '@/lib/global-provider';

const SignIn = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { loading, setLoading, setUser, isLoggedIn, setIsLoggedIn } =
    useGlobalContext();

  const formTranslateY = useRef(new Animated.Value(1000)).current;

  const handleOpenForm = () => {
    Animated.timing(formTranslateY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setShowLoginForm(true));
  };

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

    if (username.trim() === '' || !username) {
      setError('Unesite korisničko ime!');
      return;
    }

    if (password.trim() === '' || !password) {
      setError('Unesite lozinku!');
      return;
    }

    const res = {
      status: true,
    };

    if (res?.status) {
      setUser({
        $id: '1',
        username,
      });
      setIsLoggedIn(true);
      router.push('/');
    } else {
      setError('Pogrešni kredencijali!');
    }

    setLoading(false);
  };

  const handleRegister = () => {
    router.push('/');
  };

  if (isLoggedIn) return <Redirect href='/' />;

  return (
    <SafeAreaView className='bg-primary-500 h-full'>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName='h-full flex items-center justify-center'
      >
        <Image
          source={images.splash}
          style={{
            width: '90%',
          }}
          resizeMode='contain'
        />
        <View className='w-full px-10'>
          <Text className='mb-20 text-base text-center font-rubik-medium text-accent-100'>
            ČITAČ FISKALNIH RAČUNA
          </Text>

          <View className='flex flex-col gap-4'>
            <TouchableOpacity
              onPress={handleOpenForm}
              className='shadow-md border-primary-500 border-2 bg-white text-center py-3 rounded-full w-full'
            >
              <Text className='text-lg font-rubik-medium text-center text-primary-500'>
                LOGIN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRegister}
              className='shadow-md border-white border-2 bg-transparent text-center py-3 rounded-full w-full text-accent-100'
            >
              <Text className='text-lg font-rubik-medium text-center text-accent-100'>
                REGISTRACIJA
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showLoginForm && (
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
              <TouchableWithoutFeedback>
                <View>
                  <Text className='text-xl font-rubik-medium text-center mb-6'>
                    Unesite vaše kredencijale
                  </Text>
                  <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 mb-4'>
                    <Feather name='user' size={24} color='black' />
                    <TextInput
                      placeholder='Korisničko ime'
                      className='pl-4 font-rubik border-none outline-none w-full'
                      defaultValue={username}
                      onChangeText={(text) => setUsername(text)}
                    />
                  </View>

                  <View className='flex flex-row items-center border border-gray-300 rounded-lg p-4 mb-4'>
                    <Feather name='lock' size={24} color='black' />
                    <TextInput
                      placeholder='Lozinka'
                      secureTextEntry
                      className='pl-4 font-rubik border-none outline-none w-full'
                      defaultValue={password}
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
                      Uloguj se
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

export default SignIn;
