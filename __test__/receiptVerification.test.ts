import {
  amountInMinorUnits, buildVerificationScript, isOfficialPage, isOfficialReceiptUrl,
  normalizeReceiptDate, ReceiptVerificationDraft, validateVerificationDraft,
} from '@/lib/receipt-verification';

const draft: ReceiptVerificationDraft = {
  invoiceNumber: 'ABCDEFGH-12345678-123', counter: '123/456', suffix: 'PR',
  totalAmount: '3.060,00', dateTime: '10.10.2026. 14:35:12',
};

describe('receipt verification fields', () => {
  test.each([
    ['3.060,00', '306000'], ['3060.00', '306000'], ['0,01', '1'], ['0003,6', '360'],
    ['1 234,50', '123450'], ['4.513,29', '451329'], ['30,698.40', '3069840'],
    ['12.34,56', null], ['1,234.56', '123456'], ['1,23.45', null], ['3060.000', null],
    ['-10,00', null], ['', null], ['abc', null],
  ])('parses money %s without rounding', (value, expected) => {
    expect(amountInMinorUnits(value)).toBe(expected);
  });

  it('checks real dates and keeps receipt wall time independent of phone timezone', () => {
    expect(normalizeReceiptDate(draft.dateTime)).toBe('10.10.2026. 14:35');
    expect(normalizeReceiptDate('29.2.2024. 01:05')).toBe('29.2.2024. 01:05');
    for (const value of ['29.2.2025. 01:05', '31.4.2026. 10:00', '10.10.2026. 24:00', '10.10.2026. 12:00:99']) {
      expect(normalizeReceiptDate(value)).toBeNull();
    }
  });

  it('requires the actual suffix and validates identifiers without guessing', () => {
    expect(validateVerificationDraft(draft)).toBeNull();
    expect(validateVerificationDraft({ ...draft, suffix: '' })).not.toBeNull();
    expect(validateVerificationDraft({ ...draft, suffix: 'toString' })).not.toBeNull();
    expect(validateVerificationDraft({ ...draft, invoiceNumber: 'ABCDEFGH-12345678-O23' })).not.toBeNull();
    expect(validateVerificationDraft({ ...draft, counter: '123456' })).not.toBeNull();
  });

  it('maps refund suffix and amount to the official form without submitting it', () => {
    const script = buildVerificationScript(draft);
    expect(script).toContain('"InvoiceCounterExtension":"ПР"');
    expect(script).toContain('"TotalAmount":"3060,00"');
    expect(script).toContain('"SdcDateTime":"10.10.2026. 14:35"');
    expect(script).not.toContain('.submit(');
  });
});

describe('verified receipt URL boundary', () => {
  it('accepts official receipt URLs and keeps the verification form separate', () => {
    expect(isOfficialReceiptUrl('https://suf.purs.gov.rs/v/?vl=abc%2B123%3D')).toBe(true);
    expect(isOfficialReceiptUrl('https://suf.purs.gov.rs/verify')).toBe(false);
    expect(isOfficialPage('https://suf.purs.gov.rs/verify')).toBe(true);
  });

  test.each([
    'https://suf.purs.gov.rs.evil.test/v/?vl=x', 'https://suf.purs.gov.rs@evil.test/v/?vl=x',
    'http://suf.purs.gov.rs/v/?vl=x', 'https://user@suf.purs.gov.rs/v/?vl=x',
    'https://suf.purs.gov.rs:444/v/?vl=x', 'https://suf.purs.gov.rs/v/',
    'https://suf.purs.gov.rs/v/?vl=', 'not a url',
  ])('rejects invalid receipt URL %s', (value) => {
    expect(isOfficialReceiptUrl(value)).toBe(false);
  });
});
