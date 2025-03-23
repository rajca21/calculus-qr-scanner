import axios from 'axios';
import { customAlert } from '../helpers';
import {
  wsUrl,
  soapBodyBuilder,
  contentType,
  getSoapAction,
  parseXML,
  parseSK,
} from './xmlServices';

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Export učitanih računa
 * @name    UbaciWebQRScanUcitaniRacuni
 */
export const exportReceipts = async (
  dbSerialNumber: string,
  receipts: string,
  uid: string,
  sessionToken: string
): Promise<string | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder(
        'UbaciWebQRScanUcitaniRacuni',
        ['sbbaze', 'racuni', 'korisniksk', 'token'],
        [dbSerialNumber, receipts, uid, sessionToken]
      ),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('UbaciWebQRScanUcitaniRacuni'),
        },
      }
    );

    const parsedData = parseXML(data);

    if (!parsedData) {
      throw new Error('Error while uploading receipts');
    }

    const rId = parseSK('UbaciWebQRScanUcitaniRacuni', parsedData);

    if (!rId) {
      throw new Error('No user data found');
    }

    if (
      rId ===
      'ERROR [HY000] [Sybase][ODBC Driver][SQL Anywhere]User-defined exception signaled'
    ) {
      customAlert(
        'Greška',
        'Greška prilikom izvoza računa! Ulogujte se i pokušajte ponovo.'
      );
      return null;
    }

    return 'success';
  } catch (error) {
    customAlert('Greška', 'Greška prilikom izvoza računa');
    return null;
  }
};
