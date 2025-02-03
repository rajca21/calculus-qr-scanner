import { Alert, Platform, ToastAndroid } from 'react-native';

export const customAlert = (title: string, message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.BOTTOM);
  } else {
    Alert.alert(title, message);
  }
};

export const hasMaliciousInput = (text: string) => {
  const regex = /['";<>(){}]/g;
  if (regex.test(text)) {
    console.warn('Potentially harmful characters detected!');
    customAlert('Upozorenje!', 'Nije dozvoljen unos karaktera \'";<>(){}');
    return true;
  }
  return false;
};
