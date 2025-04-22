import axios from 'axios';
import { User } from '../types/User';
import { customAlert } from '../helpers';

const API_AUTH_URL = 'https://calculus-qr-scanner-api.onrender.com/api/auth';
const API_USERS_URL = 'https://calculus-qr-scanner-api.onrender.com/api/users';

// # REGISTER USER
export const register = async (
  email: string,
  password: string,
  pib: string,
  companyName: string,
  contact: string
): Promise<string | null> => {
  try {
    const res = await axios.post(
      `${API_AUTH_URL}/register`,
      {
        email,
        password,
        companyId: pib,
        companyName,
        contact,
      },
      {
        validateStatus: () => true,
      }
    );

    if (res.status === 201) {
      return 'success';
    } else if (res.status === 400) {
      customAlert('Upozorenje', res.data);
      return null;
    } else {
      throw new Error('Greška prilikom registracije');
    }
  } catch (error) {
    customAlert('Greška', 'Greška prilikom registracije');
    return null;
  }
};

export const login = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const res = await axios.post(
      `${API_AUTH_URL}/login`,
      { email, password },
      {
        validateStatus: () => true,
      }
    );

    let uid: string = '';

    if (res.status === 200) {
      uid = res.data.user;
    } else if (res.status === 400) {
      customAlert('Upozorenje', res.data);
      return null;
    } else {
      throw new Error('Greška prilikom prijavljivanja korisnika');
    }

    return getUserById(uid, email);
  } catch (error) {
    customAlert('Greška', 'Greška prilikom prijavljivanja korisnika!');
    return null;
  }
};

export const logout = async (
  korisniksk: string,
  sessionToken: string
): Promise<string | null> => {
  try {
    const res = await axios.post(
      `${API_AUTH_URL}/logout`,
      {
        uid: korisniksk,
        token: sessionToken,
      },
      {
        validateStatus: () => true,
      }
    );

    if (res.status === 200) {
      return 'success';
    } else if (res.status === 400) {
      customAlert('Upozorenje', res.data);
      return null;
    } else {
      throw new Error('Greška prilikom odjavljivanja korisnika');
    }
  } catch (error) {
    customAlert('Greška', 'Greška prilikom odjavljivanja korisnika!');
    return null;
  }
};

export const getUserById = async (
  id: string,
  email: string = ''
): Promise<User | null> => {
  try {
    const res = await axios.get(`${API_USERS_URL}/${id}`, {
      validateStatus: () => true,
    });

    if (res.status === 200) {
      const user: User = {
        uid: res.data.user.QRScanKorisnikSK,
        email,
        sessionToken: res?.data?.user?.SessionToken || null,
        companyName: res.data.user.nazivfirme,
        contact: res.data.user?.Kontakt || '',
        databases: res?.data?.user?.SerijskiBrojevi
          ? res.data.user.SerijskiBrojevi.split(',').map(
              (serialNum: string) => ({
                serialNum: serialNum.trim(),
              })
            )
          : [],
        verified: res?.data?.user?.SerijskiBrojevi === '' ? false : true,
        selectedDB: null,
      };
      user.selectedDB = user.verified ? user.databases[0]?.serialNum : null;
      return user;
    } else if (res.status === 400 || res.status === 404) {
      customAlert('Upozorenje', res.data);
      return null;
    } else {
      throw new Error('Greška prilikom povlačenja podataka o korisniku');
    }
  } catch (error) {
    customAlert('Greška', 'Greška prilikom povlačenja podataka o korisniku');
    return null;
  }
};

export const resetPassword = async (
  korisniksk: string,
  sessionToken: string,
  password: string,
  newPassword: string
): Promise<string | null> => {
  try {
    const res = await axios.put(
      `${API_USERS_URL}/${korisniksk}/password`,
      {
        token: sessionToken,
        password,
        newPassword,
      },
      {
        validateStatus: () => true,
      }
    );

    if (res.status === 202) {
      return 'success';
    } else if (res.status === 400 || res.status === 403) {
      customAlert('Upozorenje', res.data);
      return null;
    } else {
      throw new Error('Greška prilikom izmene lozinke!');
    }
  } catch (error) {
    customAlert('Greška', 'Greška prilikom izmene lozinke!');
    return null;
  }
};

export const updateProfileInfo = async (
  korisniksk: string,
  sessionToken: string,
  contact: string
): Promise<string | null> => {
  try {
    const res = await axios.put(
      `${API_USERS_URL}/${korisniksk}/profile`,
      {
        token: sessionToken,
        contact,
      },
      {
        validateStatus: () => true,
      }
    );

    if (res.status === 202) {
      return 'success';
    } else if (res.status === 400 || res.status === 403) {
      customAlert('Upozorenje', res.data);
      return null;
    } else {
      throw new Error('Greška prilikom izmene lozinke!');
    }
  } catch (error) {
    customAlert('Greška', 'Greška prilikom ažuriranja podataka!');
    return null;
  }
};
