import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';
import { Redirect, Slot } from 'expo-router';

import { useGlobalContext } from '@/lib/global-provider';
import { getLocalStorage } from '@/lib/localAsyncStorage';
import {
  getDateTimeDBServer,
  getDateTimeWebServer,
} from '@/lib/calculusWS/serviceInfoRequests';
import { customAlert } from '@/lib/helpers';

export default function AppLayout() {
  const [apiReady, setApiReady] = useState<boolean | null>(null);

  const { loading, isLoggedIn, setLoading, setIsLoggedIn, setUser } =
    useGlobalContext();

  const getUserDetails = async () => {
    setLoading(true);
    const userInfo = await getLocalStorage('userDetails');
    if (!userInfo) {
      setIsLoggedIn(false);
      setUser(null);
    } else {
      setIsLoggedIn(true);
      setUser({
        ...userInfo,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const [webReady, dbReady] = await Promise.all([
        getDateTimeWebServer(),
        getDateTimeDBServer(),
      ]);

      if (webReady && dbReady) {
        await getUserDetails();
        setApiReady(true);
      } else {
        customAlert(
          'Upozorenje',
          'Neuspešno povezivanje sa Web ili DB serverom. Pokušajte ponovo kasnije ili se obratite korisničkoj podršci.'
        );
        setApiReady(false);
      }

      setLoading(false);
    };

    init();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className='bg-white h-full flex items-center justify-center'>
        <ActivityIndicator className='text-primary-500' size='large' />
      </SafeAreaView>
    );
  }

  if (apiReady === false) {
    return (
      <SafeAreaView className='bg-white h-full flex items-center justify-center px-4'>
        <Text className='text-center text-lg text-red-600'>
          Aplikacija trenutno ne može da se poveže sa serverom.
        </Text>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) return <Redirect href='/sign-in' />;

  return <Slot />;
}
