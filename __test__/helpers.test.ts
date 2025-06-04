import { getReceiptDataFromTC } from '@/lib/helpers';

describe('getReceiptDataFromTC parses HTML receipt data correctly', () => {
  it('should return null for invalid HTML input', () => {
    const invalidHtml = '<div>Invalid Receipt</div>';
    const result = getReceiptDataFromTC(invalidHtml);
    expect(result).toBeNull();
  });

  it('should parse valid HTML receipt data correctly', () => {
    const validHtml = `
        <span id="invoiceNumberLabel">123456</span>
        <span id="shopFullNameLabel">Test Shop</span>
        <span id="totalAmountLabel">100.00</span>
        <span id="sdcDateTimeLabel">2025-04-06 12:00:00</span>
        <pre><img src="image.jpg" />Monospace content here</pre>
        `;
    const result = getReceiptDataFromTC(validHtml);
    expect(result).toEqual({
      invoiceNumber: '123456',
      shopName: 'Test Shop',
      totalAmount: '100.00',
      sdcDateTime: '2025-04-06 12:00:00',
      monospaceContent: '<pre>Monospace content here</pre>',
    });
  });

  it('should return null for any missing values', () => {
    const htmlWithMissingFields = `
        <span id="invoiceNumberLabel">123456</span>
        <span id="shopFullNameLabel"></span>
        <span id="totalAmountLabel">100.00</span>
        <span id="sdcDateTimeLabel"></span>
        <pre>Monospace content here</pre>
        `;
    const result = getReceiptDataFromTC(htmlWithMissingFields);
    expect(result).toEqual(null);
  });

  it('should parse HTML from a real receipt example', async () => {
    const realUrl =
      'https://suf.purs.gov.rs/v/?vl=A0ZHVVpBTVM1RkdVWkFNUzUJEQAAuQ4AAMDq0w0AAAAAAAABkTwwe4AAAABvL+H6gC3+51ktAps4bDqoHDJ7u+/8CPvAlSUav22uB3bq9dSeXSfvAxrn3gr8FG0S9QSTR+R4kkPXk+YZ7sBke953YsL8aV4wDAVwoUUMT0p27NrE/Oa4WAKsWZq6Ce8+6mTQTlNK55zhx7YU3sY+OBRZWGeoxSA9WkrDElkYZ/pOBwLWxdHAnRH7zliej/GJx4vt2awp2SS0RGOreoJ+la9TYRzB93fgEkZ/1I32REfhn683Rbu9/VkhPgMU0OmTgdnf2WgNdydzzs4FCCXOmgu1K6Of/igoUIIIfuJjOYdsdGwuhWn0d0q6Zs4gf9GPInFZ1EQ1iPqTR8Uhf38VG1Lz3rKcJbVvKubHIa2z++jXJY4fGedVlq3OTurqbnomntvVShziE4bVXApj07j7FQIIkL8uKr5AG4zIpya4u3jPBCugPOb9+K2P8kCuqYdxuGiXjIFXA3Y15XuMRGBSCVTnF8By0sWJh35q570f9csB4NIakOy1WK2GlW0oQBQr3ukdOlQGwbGjoVn8Hvlnc2gyIqhlBokiwz/wGygzTChoYxPcGjCpgXP0sVLFa0mcNhsX00IG0/hOPVYt6dh/QOEgcLJPt7DtB4m3QBXmDyH+vFZkoJLeqMFCxW+4mIgXW6Ux3LyGTrga+V8sFFK7l0+UFQRjs7wFVQp+QNmjVx/2dNbEtOupOTTnQLz6+sk=';
    const response = await fetch(realUrl);
    const htmlText = await response.text();
    const result = getReceiptDataFromTC(htmlText);
    expect(result).not.toBeNull();
  });
});
