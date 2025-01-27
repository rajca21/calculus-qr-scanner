import { Alert, Platform, ToastAndroid } from 'react-native';

export const customAlert = (title: string, message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.BOTTOM);
  } else {
    Alert.alert(title, message);
  }
};
