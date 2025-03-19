import { customAlert } from '../helpers';

// # Funkcija za formatiranje ulaznih parametara metode WS
const keysValuesBuilder = (keys: string[], values: string[]) => {
  let keysValuesBody = '';
  keys.forEach((key, index) => {
    keysValuesBody += `<${key}>${values[index]}</${key}>\n`;
  });
  return keysValuesBody;
};

// # Funkcija za formatiranje okvira metode za telo metode WS
const methodWrapperBuilder = (
  method: string,
  keys: string[] = [],
  values: string[] = []
) => {
  if (keys.length > 0) {
    return `<${method} xmlns="http://tempuri.org/">
      ${keysValuesBuilder(keys, values)}</${method}>`;
  } else {
    return `<${method} xmlns="http://tempuri.org/" />`;
  }
};

// ### Funkcija za formatiranje tela (body) metode WS
export const soapBodyBuilder = (
  method: string,
  keys: string[] = [],
  values: string[] = []
) => {
  if (keys.length !== values.length) {
    return customAlert('Greška', `Greška u parametrima za metodu ${method}`);
  }

  return `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
     ${methodWrapperBuilder(method, keys, values)}
    </soap:Body>
  </soap:Envelope>`;
};

// ## Header-i zahteva
export const contentType = 'text/xml; charset=utf-8';
export const getSoapAction = (methodName: string): string => {
  return `"http://tempuri.org/${methodName}"`;
};

// ### Funkcija za parsiranje XML odgovora (soap:Body dela) ###
export const parseXMLWithRegex = (xml: string): Record<string, any> => {
  const obj: Record<string, any> = {};
  const tagRegex = /<([\w:]+)>(.*?)<\/\1>/gs;

  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    const key = match[1].split(':').pop() || match[1];
    obj[key] = match[2].trim();
  }

  return obj;
};

// ### Funckija za parsiranje Result dela iz odgovora metode ###
export const getResultFromXMLRecordForMethodName = (
  methodName: string,
  xmlRecord: Record<string, any>
): string | null => {
  const bodyContent = xmlRecord['Body'];
  if (!bodyContent) return null;

  const resultTag = `<${methodName}Result>(.*?)<\/${methodName}Result>`;
  const regex = new RegExp(resultTag, 's');
  const match = bodyContent.match(regex);
  return match ? match[1].trim() : null;
};
