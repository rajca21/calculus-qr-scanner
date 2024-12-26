import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text className='text-3xl font-bold text-red-500'>
        Calculus QR Code Scanner
      </Text>
    </View>
  );
}
