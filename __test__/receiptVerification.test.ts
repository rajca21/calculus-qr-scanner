import {
  amountInMinorUnits, buildVerificationScript, isOfficialPage, isOfficialReceiptUrl,
  normalizeReceiptDate, ReceiptVerificationDraft, validateVerificationDraft, getVerificationErrors, maskReceiptDate,
} from '@/lib/receipt-verification';
import { runInNewContext } from 'node:vm';

const draft: ReceiptVerificationDraft = {
  invoiceNumber: 'ABCDEFGH-12345678-123', counter: '123/456', suffix: 'PR',
  totalAmount: '3.060,00', dateTime: '10.10.2026. 14:35:12',
};

describe('receipt verification fields', () => {
  it('accepts variable identifier and counter lengths while rejecting malformed segments', () => {
    for (const invoiceNumber of ['A-B-1', 'ABC123-ABCDEFGHIJKLMNO-000123', `${'A'.repeat(45)}-B-123`]) {
      expect(validateVerificationDraft({ ...draft, invoiceNumber, counter: `${'1'.repeat(40)}/2` })).toBeNull();
    }
    for (const invoiceNumber of ['A--1', '-B-1', 'A-B-C', 'A-B-1-2', 'A B-C-1']) {
      expect(getVerificationErrors({ ...draft, invoiceNumber }).invoiceNumber).toBeDefined();
    }
    expect(Object.keys(getVerificationErrors({ ...draft, counter: '1/', dateTime: '31.02.2026. 14:35', totalAmount: '12,345' })))
      .toEqual(['counter', 'totalAmount', 'dateTime']);
  });

  it('masks incremental typing, backspace, and pasted dates without changing seconds', () => {
    let value = '';
    for (const digit of '10102026143512') value = maskReceiptDate(value + digit);
    expect(value).toBe('10.10.2026. 14:35:12');
    for (let i = 0; i < 14; i++) value = maskReceiptDate(value.slice(0, -1));
    expect(value).toBe('');
    expect(maskReceiptDate('1.2.2026. 3:04:05')).toBe('01.02.2026. 03:04:05');
    expect(maskReceiptDate('101020261435')).toBe('10.10.2026. 14:35');
    expect(maskReceiptDate('10102026143512345')).toBe('10.10.2026. 14:35:12');
  });
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

describe('TaxCore result bridge', () => {
  function page(form: boolean) {
    const messages: Record<string, string>[] = [];
    const elements: Record<string, { textContent: string }> = form ? { verifyForm: { textContent: '' } } : {};
    const inputs = { InvoiceNumberSe: { value: '', dispatchEvent: jest.fn() } };
    let mutation = () => {};
    const context = {
      location: { origin: 'https://suf.purs.gov.rs' },
      window: { ReactNativeWebView: { postMessage: (value: string) => messages.push(JSON.parse(value)) }, scrollTo: jest.fn() },
      document: {
        readyState: 'complete', body: { scrollHeight: 1800 }, documentElement: { scrollHeight: 2000 },
        getElementById: (id: string) => elements[id] ?? null,
        querySelector: (query: string) => query.includes('InvoiceNumberSe') ? inputs.InvoiceNumberSe : null,
      },
      MutationObserver: class {
        constructor(callback: () => void) { mutation = callback; }
        observe() {} disconnect() {}
      },
      Event: class {}, setInterval, clearInterval, setTimeout,
    };
    return { context, messages, elements, inputs, mutate: () => mutation() };
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

  it('does not advance or scroll on form validation errors, or overwrite user corrections', () => {
    const fixture = page(true);
    runInNewContext(buildVerificationScript(draft), fixture.context);
    jest.advanceTimersByTime(500);
    expect(fixture.inputs.InvoiceNumberSe.value).toBe(draft.invoiceNumber);
    fixture.inputs.InvoiceNumberSe.value = 'CORRECTED-ID-123';
    runInNewContext(buildVerificationScript(draft), fixture.context);
    jest.advanceTimersByTime(500);
    expect(fixture.inputs.InvoiceNumberSe.value).toBe('CORRECTED-ID-123');
    expect(fixture.messages.some((message) => message.stage === 'result')).toBe(false);
    expect(fixture.context.window.scrollTo).not.toHaveBeenCalled();

    const validationResponse = page(true);
    validationResponse.inputs.InvoiceNumberSe.value = 'CORRECTED-ID-123';
    runInNewContext(buildVerificationScript(draft, false), validationResponse.context);
    jest.advanceTimersByTime(500);
    expect(validationResponse.inputs.InvoiceNumberSe.value).toBe('CORRECTED-ID-123');
  });

  it('detects an asynchronously rendered receipt on the same URL and scrolls only once', () => {
    const fixture = page(false);
    runInNewContext(buildVerificationScript(draft), fixture.context);
    fixture.elements.invoiceNumberLabel = { textContent: ' CORRECTED-ID-123 ' };
    fixture.elements.totalAmountLabel = { textContent: ' 1.234,56 ' };
    fixture.mutate();
    jest.advanceTimersByTime(500);
    expect(fixture.messages).toContainEqual({ type: 'verification-page', stage: 'result', invoiceNumber: 'CORRECTED-ID-123', totalAmount: '1.234,56' });
    expect(fixture.context.window.scrollTo).toHaveBeenCalledWith(0, 2000);
    fixture.mutate();
    runInNewContext(buildVerificationScript(draft), fixture.context);
    jest.advanceTimersByTime(500);
    expect(fixture.context.window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('ignores pages outside the official origin', () => {
    const fixture = page(true);
    fixture.context.location.origin = 'https://example.com';
    runInNewContext(buildVerificationScript(draft), fixture.context);
    jest.runOnlyPendingTimers();
    expect(fixture.messages).toEqual([]);
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
