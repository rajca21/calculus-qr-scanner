import axios from 'axios';
import { User } from '../types/User';
import { customAlert } from '../helpers';
import { wsUrl } from './serviceInfoRequests';
import {
  contentType,
  getSoapAction,
  parseXMLToJson,
  soapBodyBuilder,
} from './xmlServices';

/**
 * @route   POST http://{ipAddress}/ClcWS/CalculusWebService.asmx
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

    const uidJsonData = parseXMLToJson(data);
    const uid =
      uidJsonData.Envelope?.Body?.AzurWebQRScanKorisnikResponse
        ?.AzurWebQRScanKorisnikResult;

    if (
      uid ===
      'ERROR [HY000] [Sybase][ODBC Driver][SQL Anywhere]User-defined exception signaled'
    ) {
      customAlert('Greška', 'Pogrešni kredencijali');
      return null;
    }

    return getUserById(uid, email);
  } catch (error) {
    customAlert('Greška', 'Greška prilikom logovanja korisnika!');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/ClcWS/CalculusWebService.asmx
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

    const uidJsonData = parseXMLToJson(data);
    const uid =
      uidJsonData.Envelope?.Body?.AzurWebQRScanKorisnikResponse
        ?.AzurWebQRScanKorisnikResult;

    if (
      uid ===
      'ERROR [HY000] [Sybase][ODBC Driver][SQL Anywhere]User-defined exception signaled'
    ) {
      customAlert('Greška', 'Greška prilikom odjavljivanja');
      return null;
    }

    return 'success';
  } catch (error) {
    customAlert('Greška', 'Greška prilikom odjavljivanja korisnika!');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/ClcWS/CalculusWebService.asmx
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

    const jsonData = parseXMLToJson(data);

    const uid =
      jsonData.Envelope?.Body?.UbaciWebQRScanKorisnikResponse
        ?.UbaciWebQRScanKorisnikResult;

    if (
      uid ===
      "ERROR [23000] [Sybase][ODBC Driver][SQL Anywhere]Index 'AK_WebQRScanKorisnikEmail' for table 'WebQRScanKorisnik' would not be unique"
    ) {
      customAlert('Upozorenje!', 'Korisnik sa ovom email adresom već postoji!');
      return null;
    }

    return 'success';
  } catch (error) {
    customAlert('Greška', 'Greška prilikom registracije');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/ClcWS/CalculusWebService.asmx
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

    const jsonData = parseXMLToJson(data);

    const tables =
      jsonData.Envelope?.Body?.DajWebQRScanKorisnikResponse
        ?.DajWebQRScanKorisnikResult?.diffgram?.NewDataSet?.Table;

    if (!tables) {
      throw new Error('No user data found');
    }

    const user: User = {
      uid: id,
      email,
      companyName: tables.nazivfirme,
      contact: tables.Kontakt,
      databases: tables.SerijskiBrojevi
        ? tables.SerijskiBrojevi.split(',').map((serialNum: string) => ({
            serialNum: serialNum.trim(),
          }))
        : [],
      sessionToken: tables.SessionToken,
      verified: tables.SerijskiBrojevi === '' ? false : true,
      selectedDB: null,
    };

    user.selectedDB = user.verified ? user.databases[0]?.serialNum : null;

    return user;
  } catch (error) {
    customAlert('Greška', 'Greška prilikom vraćanja podataka o korisniku');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/ClcWS/CalculusWebService.asmx
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

    const uidJsonData = parseXMLToJson(data);
    const uid =
      uidJsonData.Envelope?.Body?.AzurWebQRScanKorisnikResponse
        ?.AzurWebQRScanKorisnikResult;

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
 * @route   POST http://{ipAddress}/ClcWS/CalculusWebService.asmx
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

    const uidJsonData = parseXMLToJson(data);
    const uid =
      uidJsonData.Envelope?.Body?.AzurWebQRScanKorisnikResponse
        ?.AzurWebQRScanKorisnikResult;

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
