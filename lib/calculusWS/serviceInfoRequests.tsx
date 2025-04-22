import axios from 'axios';
import { customAlert } from '../helpers';

const API_INFO_URL = 'https://calculus-qr-scanner-api.onrender.com/api/info';

export const getDateTimeWebServer = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${API_INFO_URL}/ws`);

    if (res.status !== 200) {
      return false;
    }

    return true;
  } catch (error) {
    customAlert('Greška', 'Greška prilikom pokretanja Web servera');
    return null;
  }
};

export const getDateTimeDBServer = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${API_INFO_URL}/db`);

    if (res.status !== 200) {
      return false;
    }

    return true;
  } catch (error) {
    customAlert('Greška', 'Greška prilikom pokretanja DB servera');
    return null;
  }
};
