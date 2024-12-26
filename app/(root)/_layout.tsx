import { ActivityIndicator, SafeAreaView } from 'react-native';
import { Redirect, Slot } from 'expo-router';

import { useGlobalContext } from '@/lib/global-provider';

export default function AppLayout() {
  const { loading, isLoggedIn } = useGlobalContext();

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
