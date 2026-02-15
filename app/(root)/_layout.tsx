import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGlobalContext } from '@/lib/global-provider';
import { getLocalStorage, removeLocalStorage } from '@/lib/localAsyncStorage';
import {
  getDateTimeDBServer,
  getDateTimeWebServer,
} from '@/lib/calculusWS/serviceInfoRequests';
import { customAlert } from '@/lib/helpers';
import { validateSession } from '@/lib/calculusWS/auhtenticationServices';

export default function AppLayout() {
  const [apiReady, setApiReady] = useState<boolean | null>(null);

  const { loading, isLoggedIn, setLoading, setIsLoggedIn, setUser } =
    useGlobalContext();

  const logoutLocal = async () => {
    await removeLocalStorage();
    setUser(null);
    setIsLoggedIn(false);
  };

  const bootstrapAuth = async () => {
    const userInfo = await getLocalStorage('userDetails');

    if (!userInfo) {
      await logoutLocal();
      return;
    }

    const uid = userInfo?.uid;
    const token = userInfo?.sessionToken;

    if (!uid || !token) {
      await logoutLocal();
      return;
    }

    const ok = await validateSession(String(uid), String(token));

    if (!ok) {
      await logoutLocal();
      return;
    }

    setUser({ ...userInfo });
    setIsLoggedIn(true);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const [webReady, dbReady] = await Promise.all([
        getDateTimeWebServer(),
        getDateTimeDBServer(),
      ]);

      if (webReady && dbReady) {
        await bootstrapAuth();
        setApiReady(true);
      } else {
        customAlert(
          'Upozorenje',
          'Neuspešno povezivanje sa Web ili DB serverom. Pokušajte ponovo kasnije ili se obratite korisničkoj podršci.',
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
