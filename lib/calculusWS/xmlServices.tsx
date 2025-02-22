// ### Parametri zahteva koji se šalju do Web Servisa ###
export const soapBody = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <ServiceInfo xmlns="http://www.calculus.rs/webservices/" />
    </soap:Body>
  </soap:Envelope>`;
export const contentType = 'text/xml; charset=utf-8';
export const getSoapAction = (methodName: string): string => {
  return `"http://www.calculus.rs/webservices/${methodName}"`;
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
