import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';

import images from '@/assets/constants/images';
import { useGlobalContext } from '@/lib/global-provider';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

const SignIn = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const { isLoggedIn } = useGlobalContext();

  const formTranslateY = useRef(new Animated.Value(1000)).current;
  const formRegTranslateY = useRef(new Animated.Value(1000)).current;

  const handleOpenForm = () => {
    setShowLoginForm(true);
    formTranslateY.setValue(1000);
    Animated.timing(formTranslateY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleOpenRegForm = () => {
    setShowRegisterForm(true);
    formRegTranslateY.setValue(1000);
    Animated.timing(formRegTranslateY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
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
              onPress={handleOpenRegForm}
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
        <LoginForm
          formTranslateY={formTranslateY}
          setShowLoginForm={setShowLoginForm}
        />
      )}

      {showRegisterForm && (
        <RegisterForm
          formRegTranslateY={formRegTranslateY}
          setShowRegisterForm={setShowRegisterForm}
        />
      )}
    </SafeAreaView>
  );
};

export default SignIn;
