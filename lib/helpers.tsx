import { Alert, Platform, ToastAndroid } from 'react-native';
import { ReceiptDataFromTC } from './types/Receipt';
import { User } from './types/User';

// Poseban Alert koji se menja za iPhone i Android uređaje
export const customAlert = (title: string, message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.BOTTOM);
  } else {
    Alert.alert(title, message);
  }
};

// Provera malicious karaktera na inputima
export const hasMaliciousInput = (text: string) => {
  const regex = /['";<>(){}]/g;
  if (regex.test(text)) {
    console.warn('Potentially harmful characters detected!');
    customAlert('Upozorenje!', 'Nije dozvoljen unos karaktera \'";<>(){}');
    return true;
  }
  return false;
};

// Parsiranje podataka iz TaxCore
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

// Izvlačenje naziva baze na osnovu selektovane baze
export function getSelectedDBName(user: User): string | null {
  if (!user?.selectedDB) return null;

  const db = user.databases.find(
    (database) => database.serialNum === user.selectedDB
  );

  return db ? db.name : null;
}
