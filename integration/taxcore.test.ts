import { getReceiptDataFromTC } from '@/lib/helpers';
import { get } from 'node:https';

describe('TaxCore live integration', () => {
  it('should parse HTML from a real receipt example', async () => {
    const realUrl =
      'https://suf.purs.gov.rs/v/?vl=A0ZHVVpBTVM1RkdVWkFNUzUJEQAAuQ4AAMDq0w0AAAAAAAABkTwwe4AAAABvL+H6gC3+51ktAps4bDqoHDJ7u+/8CPvAlSUav22uB3bq9dSeXSfvAxrn3gr8FG0S9QSTR+R4kkPXk+YZ7sBke953YsL8aV4wDAVwoUUMT0p27NrE/Oa4WAKsWZq6Ce8+6mTQTlNK55zhx7YU3sY+OBRZWGeoxSA9WkrDElkYZ/pOBwLWxdHAnRH7zliej/GJx4vt2awp2SS0RGOreoJ+la9TYRzB93fgEkZ/1I32REfhn683Rbu9/VkhPgMU0OmTgdnf2WgNdydzzs4FCCXOmgu1K6Of/igoUIIIfuJjOYdsdGwuhWn0d0q6Zs4gf9GPInFZ1EQ1iPqTR8Uhf38VG1Lz3rKcJbVvKubHIa2z++jXJY4fGedVlq3OTurqbnomntvVShziE4bVXApj07j7FQIIkL8uKr5AG4zIpya4u3jPBCugPOb9+K2P8kCuqYdxuGiXjIFXA3Y15XuMRGBSCVTnF8By0sWJh35q570f9csB4NIakOy1WK2GlW0oQBQr3ukdOlQGwbGjoVn8Hvlnc2gyIqhlBokiwz/wGygzTChoYxPcGjCpgXP0sVLFa0mcNhsX00IG0/hOPVYt6dh/QOEgcLJPt7DtB4m3QBXmDyH+vFZkoJLeqMFCxW+4mIgXW6Ux3LyGTrga+V8sFFK7l0+UFQRjs7wFVQp+QNmjVx/2dNbEtOupOTTnQLz6+sk=';
    // Expo's Jest preset mocks native fetch; use Node HTTP for this live check.
    const htmlText = await new Promise<string>((resolve, reject) => {
      const request = get(realUrl, (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`TaxCore returned HTTP ${response.statusCode}`));
          return;
        }
        response.setEncoding('utf8');
        let html = '';
        response.on('data', (chunk) => { html += chunk; });
        response.on('end', () => resolve(html));
        response.on('error', reject);
      });
      request.setTimeout(15000, () => request.destroy(new Error('TaxCore request timed out')));
      request.on('error', reject);
    });
    const result = getReceiptDataFromTC(htmlText);
    expect(result).not.toBeNull();
  });
});
