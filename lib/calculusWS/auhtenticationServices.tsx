import axios from 'axios';
import { User } from '../types/User';
import { customAlert } from '../helpers';
import {
  contentType,
  getSoapAction,
  parseSK,
  parseVariable,
  parseXML,
  soapBodyBuilder,
  wsUrl,
} from './xmlServices';

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Logovanje korisnika
 * @name    AzurWebQRScanKorisnik
 */
export const login = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder(
        'AzurWebQRScanKorisnik',
        [
          'korisniksk',
          'email',
          'lozinka',
          'novalozinka',
          'pib',
          'nazivfirme',
          'kontakt',
          'token',
          'tipazur',
        ],
        ['0', email, password, '', '', '', '', '', 'L']
      ),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('AzurWebQRScanKorisnik'),
        },
      }
    );

    const parsedData = parseXML(data);

    if (!parsedData) {
      throw new Error('No user data found');
    }

    const uid = parseSK('AzurWebQRScanKorisnik', parsedData);

    if (
      uid ===
      'ERROR [HY000] [Sybase][ODBC Driver][SQL Anywhere]User-defined exception signaled'
    ) {
      customAlert('Greška', 'Pogrešni kredencijali');
      return null;
    }

    if (!uid) {
      throw new Error('No user data found');
    }

    return getUserById(uid, email);
  } catch (error) {
    customAlert('Greška', 'Greška prilikom logovanja korisnika!');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Logout korisnika
 * @name    AzurWebQRScanKorisnik
 */
export const logout = async (
  korisniksk: string,
  sessionToken: string
): Promise<string | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder(
        'AzurWebQRScanKorisnik',
        [
          'korisniksk',
          'email',
          'lozinka',
          'novalozinka',
          'pib',
          'nazivfirme',
          'kontakt',
          'token',
          'tipazur',
        ],
        [korisniksk, '', '', '', '', '', '', sessionToken, 'O']
      ),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('AzurWebQRScanKorisnik'),
        },
      }
    );

    const parsedData = parseXML(data);

    if (!parsedData) {
      throw new Error('No user data found');
    }

    const uid = parseSK('AzurWebQRScanKorisnik', parsedData);

    if (!uid) {
      throw new Error('No user data found');
    }

    return 'success';
  } catch (error) {
    customAlert('Greška', 'Greška prilikom odjavljivanja korisnika!');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Registracija korisnika
 * @name    UbaciWebQRScanKorisnik
 */
export const register = async (
  email: string,
  password: string,
  pib: string,
  companyName: string,
  contact: string
): Promise<string | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder(
        'UbaciWebQRScanKorisnik',
        ['email', 'lozinka', 'pib', 'nazivfirme', 'kontakt', 'token'],
        [email, password, pib, companyName, contact, '']
      ),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('UbaciWebQRScanKorisnik'),
        },
      }
    );

    const parsedData = parseXML(data);

    if (!parsedData) {
      throw new Error('No user data found');
    }

    const uid = parseSK('AzurWebQRScanKorisnik', parsedData);

    if (
      uid ===
      "ERROR [23000] [Sybase][ODBC Driver][SQL Anywhere]Index 'AK_WebQRScanKorisnikEmail' for table 'WebQRScanKorisnik' would not be unique"
    ) {
      customAlert('Upozorenje!', 'Korisnik sa ovom email adresom već postoji!');
      return null;
    }

    if (!uid) {
      throw new Error('No user data found');
    }

    return 'success';
  } catch (error) {
    customAlert('Greška', 'Greška prilikom registracije');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Vraća podatke o korisniku
 * @name    DajWebQRScanKorisnik
 */
export const getUserById = async (
  id: string,
  email: string = ''
): Promise<User | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder('DajWebQRScanKorisnik', ['QRScanKorisnikSK'], [id]),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('DajWebQRScanKorisnik'),
        },
      }
    );

    const parsedData = parseXML(data);
    // const jsonData = JSON.stringify(parsedData, null, 2);
    if (!parsedData) {
      throw new Error('No user data found');
    }

    const serialNumbers = parseVariable(
      'SerijskiBrojevi',
      'DajWebQRScanKorisnik',
      parsedData
    );

    const user: User = {
      uid: parseVariable(
        'QRScanKorisnikSK',
        'DajWebQRScanKorisnik',
        parsedData
      ),
      email,
      companyName: parseVariable(
        'nazivfirme',
        'DajWebQRScanKorisnik',
        parsedData
      ),
      contact: parseVariable('Kontakt', 'DajWebQRScanKorisnik', parsedData),
      databases: serialNumbers
        ? serialNumbers.split(',').map((serialNum: string) => ({
            serialNum: serialNum.trim(),
          }))
        : [],
      sessionToken: parseVariable(
        'SessionToken',
        'DajWebQRScanKorisnik',
        parsedData
      ),
      verified: serialNumbers === '' ? false : true,
      selectedDB: null,
    };

    user.selectedDB = user.verified ? user.databases[0]?.serialNum : null;

    return user;
  } catch (error) {
    console.log(error);
    customAlert('Greška', 'Greška prilikom vraćanja podataka o korisniku');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Izmena lozinke
 * @name    AzurWebQRScanKorisnik
 */
export const resetPassword = async (
  korisniksk: string,
  sessionToken: string,
  password: string,
  newPassword: string
): Promise<string | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder(
        'AzurWebQRScanKorisnik',
        [
          'korisniksk',
          'email',
          'lozinka',
          'novalozinka',
          'pib',
          'nazivfirme',
          'kontakt',
          'token',
          'tipazur',
        ],
        [korisniksk, '', password, newPassword, '', '', '', sessionToken, 'R']
      ),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('AzurWebQRScanKorisnik'),
        },
      }
    );

    const parsedData = parseXML(data);

    if (!parsedData) {
      throw new Error('No user data found');
    }

    const uid = parseSK('AzurWebQRScanKorisnik', parsedData);

    if (
      uid ===
      'ERROR [HY000] [Sybase][ODBC Driver][SQL Anywhere]User-defined exception signaled'
    ) {
      customAlert(
        'Greška',
        'Greška prilikom izmene lozinke! Da li ste uneli ispravnu trenutnu lozinku?'
      );
      return null;
    }

    return 'success';
  } catch (error) {
    customAlert('Greška', 'Greška prilikom izmene lozinke!');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Ažuriranje informacija o profilu
 * @name    AzurWebQRScanKorisnik
 */
export const updateProfileInfo = async (
  korisniksk: string,
  sessionToken: string,
  contact: string
): Promise<string | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder(
        'AzurWebQRScanKorisnik',
        [
          'korisniksk',
          'email',
          'lozinka',
          'novalozinka',
          'pib',
          'nazivfirme',
          'kontakt',
          'token',
          'tipazur',
        ],
        [korisniksk, '', '', '', '', '', contact, sessionToken, 'P']
      ),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('AzurWebQRScanKorisnik'),
        },
      }
    );

    const parsedData = parseXML(data);

    if (!parsedData) {
      throw new Error('No user data found');
    }

    const uid = parseSK('AzurWebQRScanKorisnik', parsedData);

    if (
      uid ===
      'ERROR [HY000] [Sybase][ODBC Driver][SQL Anywhere]User-defined exception signaled'
    ) {
      customAlert('Greška', 'Greška prilikom ažuriranja podataka!');
      return null;
    }

    return 'success';
  } catch (error) {
    customAlert('Greška', 'Greška prilikom ažuriranja podataka!');
    return null;
  }
};
