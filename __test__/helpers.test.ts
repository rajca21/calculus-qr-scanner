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
        <span id="totalAmountLabel">100.00</span>
        <span id="sdcDateTimeLabel">2025-04-06 12:00:00</span>
        <pre><img src="image.jpg" />Monospace content here</pre>
        `;
    const result = getReceiptDataFromTC(validHtml);
    expect(result).toEqual({
      invoiceNumber: '123456',
      shopName: '',
      totalAmount: '100.00',
      sdcDateTime: '2025-04-06 12:00:00',
      monospaceContent: '<pre>Monospace content here</pre>',
    });
  });

  it('should return null for any missing values', () => {
    const htmlWithMissingFields = `
        <span id="invoiceNumberLabel">123456</span>
        <span id="totalAmountLabel">100.00</span>
        <span id="sdcDateTimeLabel"></span>
        <pre>Monospace content here</pre>
        `;
    const result = getReceiptDataFromTC(htmlWithMissingFields);
    expect(result).toEqual(null);
  });

});
