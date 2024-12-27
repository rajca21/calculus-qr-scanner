import { Image, TouchableOpacity, View } from 'react-native';

import images from '@/assets/constants/images';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2368fd',
      }}
    >
      <TouchableOpacity onPress={() => console.log('camera open')}>
        <Image
          source={images.scan}
          className='rounded-full'
          style={{
            width: 250,
            height: 250,
          }}
          resizeMode='contain'
        />
      </TouchableOpacity>
    </View>
  );
}
