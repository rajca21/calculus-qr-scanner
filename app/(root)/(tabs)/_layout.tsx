import { Image, ImageSourcePropType, View } from 'react-native';
import { Tabs } from 'expo-router';

import icons from '@/assets/constants/icons';

const TabIcon = ({
  focused,
  icon,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
}) => (
  <View className='flex-1 mt-3 flex flex-col items-center'>
    <Image
      source={icon}
      tintColor={focused ? '#2368fd' : '#666876'}
      resizeMode='contain'
      className='size-6'
      style={{
        width: 25,
        height: 25,
      }}
    />
  </View>
);

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'white',
          position: 'absolute',
          borderTopColor: '#666876',
          borderTopWidth: 1,
          minHeight: 70,
          paddingTop: 15,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Skeniraj',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.qrcode} />
          ),
        }}
      />
      <Tabs.Screen
        name='receipts'
        options={{
          title: 'Računi',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.receipt} />
          ),
        }}
      />
      <Tabs.Screen
        name='config'
        options={{
          title: 'Postavke',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.settings} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
