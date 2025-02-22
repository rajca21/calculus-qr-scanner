import axios from 'axios';
import {
  contentType,
  getResultFromXMLRecordForMethodName,
  getSoapAction,
  parseXMLWithRegex,
  soapBody,
} from '../calculusWS/xmlServices';
import { customAlert } from '../helpers';

export const firstService =
  'http://89.216.22.118/CalculusPop97WS/CalculusPop97WS.asmx';
export const secondService =
  'http://79.175.123.183/CalculusPop97WS/CalculusPop97WS.asmx';

/**
 * @route   POST http://{firstService|secondService}/CalculusPop97WS/CalculusPop97WS.asmx
 * @desc    Pronalazi dostupan servis, prvo poziva prvi, zatim drugi i vraća onaj koji je dostupan
 * @name    ServisJeDostupan
 */
export const getAvailableService = async (): Promise<string> => {
  try {
    let { data } = await axios.post(firstService, soapBody, {
      headers: {
        'Content-Type': contentType,
        'SOAPAction': getSoapAction('ServisJeDostupan'),
      },
    });
    let xmlRecord = parseXMLWithRegex(data);
    let result = getResultFromXMLRecordForMethodName(
      'ServisJeDostupan',
      xmlRecord
    );
    if (result === 'true') {
      return firstService;
    } else {
      let { data } = await axios.post(secondService, soapBody, {
        headers: {
          'Content-Type': contentType,
          'SOAPAction': getSoapAction('ServisJeDostupan'),
        },
      });
      let xmlRecord = parseXMLWithRegex(data);
      let result = getResultFromXMLRecordForMethodName(
        'ServisJeDostupan',
        xmlRecord
      );

      if (result === 'true') {
        return secondService;
      } else {
        return '';
      }
    }
  } catch (error) {
    try {
      let { data } = await axios.post(secondService, soapBody, {
        headers: {
          'Content-Type': contentType,
          'SOAPAction': getSoapAction('ServisJeDostupan'),
        },
      });
      let xmlRecord = parseXMLWithRegex(data);
      let result = getResultFromXMLRecordForMethodName(
        'ServisJeDostupan',
        xmlRecord
      );

      if (result === 'true') {
        return secondService;
      }
    } catch (error) {
      customAlert('Greška', 'Greška prilikom povlaćenja dostupnog servisa');
      return '';
    }
  }
};

/**
 * @route   POST http://{avaiableService}/CalculusPop97WS/CalculusPop97WS.asmx
 * @desc    Vraća podatke o servisu
 * @name    ServiceInfo
 */
export const getServiceInfo = async (): Promise<string | null> => {
  try {
    const availableService = await getAvailableService();
    if (availableService === '') {
      throw new Error('Greška prilikom povlačenja dostupnog servisa');
    }

    let { data } = await axios.post(secondService, soapBody, {
      headers: {
        'Content-Type': contentType,
        'SOAPAction': getSoapAction('ServiceInfo'),
      },
    });
    let xmlRecord = parseXMLWithRegex(data);
    let result = getResultFromXMLRecordForMethodName('ServiceInfo', xmlRecord);
    return result;
  } catch (error) {
    customAlert('Greška', 'Greška prilikom povlaćenja informacija o servisu');
    return null;
  }
};
