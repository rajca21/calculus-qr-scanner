import axios from 'axios';
import { customAlert } from '../helpers';

const API_RECEIPTS_URL =
  'https://calculus-qr-scanner-api.onrender.com/api/receipts';

export const exportReceipts = async (
  dbSerialNumber: string,
  receipts: string,
  uid: string,
  sessionToken: string
): Promise<string | null> => {
  try {
    const res = await axios.post(
      `${API_RECEIPTS_URL}`,
      {
        dbSerialNumber,
        receipts,
        uid,
        token: sessionToken,
      },
      {
        validateStatus: () => true,
      }
    );

    console.log(res.data);

    if (res.status === 201) {
      return 'success';
    } else if (res.status === 400 || res.status === 403) {
      customAlert('Upozorenje', res.data);
      return null;
    } else {
      throw new Error('Greška prilikom izvoza računa');
    }
  } catch (error) {
    console.log(error);
    customAlert('Greška', 'Greška prilikom izvoza računa');
    return null;
  }
};
