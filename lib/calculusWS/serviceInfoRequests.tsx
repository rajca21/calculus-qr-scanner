import axios from 'axios';
import {
  contentType,
  getResultFromXMLRecordForMethodName,
  getSoapAction,
  parseXMLWithRegex,
  soapBodyBuilder,
  wsUrl,
} from '../calculusWS/xmlServices';
import { customAlert } from '../helpers';

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Vraća datum i vreme Web servera - metoda za test
 * @name    DatumVremeWebServera
 */
export const dateTimeWebServer = async (): Promise<string | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder('DatumVremeWebServera'),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('DatumVremeWebServera'),
        },
      }
    );

    let xmlRecord = parseXMLWithRegex(data);
    let result = getResultFromXMLRecordForMethodName(
      'DatumVremeWebServera',
      xmlRecord
    );

    if (result === null) {
      throw new Error('');
    }

    return result;
  } catch (error) {
    customAlert('Greška', 'Greška prilikom pokretanja Web servera');
    return null;
  }
};

/**
 * @route   POST http://{ipAddress}/CWSFiskaliQR/CalculusWebService.asmx
 * @desc    Vraća datum i vreme DB servera - metoda za test
 * @name    DatumVremeDBServera
 */
export const dateTimeDBServer = async (): Promise<string | null> => {
  try {
    let { data } = await axios.post(
      wsUrl,
      soapBodyBuilder('DatumVremeDBServera'),
      {
        headers: {
          'Content-Type': contentType,
          SOAPAction: getSoapAction('DatumVremeDBServera'),
        },
      }
    );

    let xmlRecord = parseXMLWithRegex(data);
    let result = getResultFromXMLRecordForMethodName(
      'DatumVremeDBServera',
      xmlRecord
    );

    if (result === null) {
      throw new Error('');
    }

    return result;
  } catch (error) {
    customAlert('Greška', 'Greška prilikom pokretanja DB servera');
    return null;
  }
};
