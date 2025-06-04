import { Alert, Platform, ToastAndroid } from 'react-native';
import { ReceiptDataFromTC } from './types/Receipt';

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

export const getReceiptDataFromTC = (
  htmlText: string
): ReceiptDataFromTC | null => {
  const receiptDataFromTC: ReceiptDataFromTC = {
    invoiceNumber: '',
    shopName: '',
    totalAmount: '',
    sdcDateTime: '',
    monospaceContent: '',
  };

  const invoiceNumber = htmlText.match(
    /<span id="invoiceNumberLabel"[^>]*>([\s\S]*?)<\/span>/i
  )?.[1];
  if (invoiceNumber && invoiceNumber.length > 0) {
    receiptDataFromTC.invoiceNumber = invoiceNumber.trim();
  } else {
    return null;
  }

  const shopName = htmlText.match(
    /<span id="shopFullNameLabel"[^>]*>([\s\S]*?)<\/span>/i
  )?.[1];
  if (shopName && shopName.length > 0) {
    receiptDataFromTC.shopName = shopName.trim();
  } else {
    return null;
  }

  const totalAmount = htmlText.match(
    /<span id="totalAmountLabel"[^>]*>([\s\S]*?)<\/span>/i
  )?.[1];
  if (totalAmount && totalAmount.length > 0) {
    receiptDataFromTC.totalAmount = totalAmount.trim();
  } else {
    return null;
  }

  const sdcDateTime = htmlText.match(
    /<span id="sdcDateTimeLabel"[^>]*>([\s\S]*?)<\/span>/i
  )?.[1];
  if (sdcDateTime && sdcDateTime.length > 0) {
    receiptDataFromTC.sdcDateTime = sdcDateTime.trim();
  } else {
    return null;
  }

  let preTagContent = htmlText.match(/<pre[^>]*>[\s\S]*?<\/pre>/i)?.[0];

  if (preTagContent) {
    const sanitizedPreTagContent = preTagContent.replace(/<img[^>]*>/gi, '');
    receiptDataFromTC.monospaceContent = sanitizedPreTagContent;
  } else {
    return null;
  }

  return receiptDataFromTC;
};
