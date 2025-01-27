import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { Redirect, Slot } from 'expo-router';

import { useGlobalContext } from '@/lib/global-provider';
import { getLocalStorage } from '@/lib/localAsyncStorage';

export default function AppLayout() {
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
        uid: userInfo.uid,
        email: userInfo.email,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    getUserDetails();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className='bg-white h-full flex items-center justify-center'>
        <ActivityIndicator className='text-primary-500' size='large' />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) return <Redirect href='/sign-in' />;

  return <Slot />;
}
