import { parseReceipt } from '@/lib/receipt-ocr/parseReceipt';
import type { OcrLine } from '@/modules/receipt-ocr';

const lines = (values: string[]): OcrLine[] => values.map((text, index) => ({ text, x: 0.1, y: index * 0.05, width: 0.8, height: 0.02 }));

describe('receipt OCR field extraction', () => {
  it('extracts Latin receipt fields and preserves printed seconds', () => {
    const result = parseReceipt(lines([
      'Ukupan iznos: 30,698.40', 'Gotovina: 30,698.40', 'Ukupan iznos poreza: 5,116.40',
      'PFR vreme: 09.10.2026. 12:13:35', 'PFR broj računa: ABCDEFGH-12345678-1141',
      'Brojač računa: 1088/1141PP',
    ]));
    expect(result.draft).toEqual({ invoiceNumber: 'ABCDEFGH-12345678-1141', counter: '1088/1141',
      suffix: 'PP', totalAmount: '30,698.40', dateTime: '09.10.2026. 12:13:35' });
    expect(result.missing).toEqual([]);
  });

  it('matches Cyrillic labels and counter suffixes without changing invoice letters', () => {
    const result = parseReceipt(lines([
      'Укупан износ: 4.513,29', 'Готовина: 5.000,00', 'Повраћај: 487,00',
      'Укупан износ пореза: 717,45', 'ПФР време: 03.10.2026. 16:17:35',
      'ПФР број рачуна: AB0DEFGH-123I5678-20399', 'Бројач рачуна: 20004/20399ПП',
    ]));
    expect(result.draft.invoiceNumber).toBe('AB0DEFGH-123I5678-20399');
    expect(result.draft.totalAmount).toBe('4.513,29');
    expect(result.draft.suffix).toBe('PP');
    expect(result.missing).toEqual([]);
  });

  it('uses geometric proximity for a total recognized separately from its label', () => {
    const result = parseReceipt([
      { text: 'Ukupan iznos:', x: 0.1, y: 0.5, width: 0.3, height: 0.02 },
      { text: '3.060,00', x: 0.7, y: 0.502, width: 0.2, height: 0.02 },
      { text: '5.000,00', x: 0.7, y: 0.55, width: 0.2, height: 0.02 },
    ]);
    expect(result.draft.totalAmount).toBe('3.060,00');
  });

  it('does not guess the total from items, cash, or taxes when a label is missing', () => {
    const result = parseReceipt(lines(['Artikal 100,00', 'Gotovina: 500,00', 'Ukupan iznos poreza: 16,67']));
    expect(result.draft.totalAmount).toBe('');
    expect(result.missing).toContain('totalAmount');
  });

  it('leaves differing invoice IDs, totals, and counters empty instead of mixing receipts', () => {
    const result = parseReceipt(lines([
      'ABCDEFGH-12345678-123', '12345678-ABCDEFGH-456', '123/456PP', '789/987PR',
      'Ukupan iznos: 100,00', 'Ukupan iznos: 200,00',
    ]));
    expect(result.ambiguous).toEqual(expect.arrayContaining(['invoiceNumber', 'counter', 'totalAmount']));
    expect(result.draft.invoiceNumber).toBe('');
    expect(result.draft.suffix).toBe('');
    expect(result.draft.totalAmount).toBe('');
  });

  it('normalizes spaces/dashes, maps refunds, and handles a suffix on the next line', () => {
    const result = parseReceipt(lines([
      'abcdefgh – 12345678 — 123', '12 / 34', 'ПР', '10. 10. 2026. 14:35:12', 'Ukupan iznos 100,00',
    ]));
    expect(result.draft.invoiceNumber).toBe('ABCDEFGH-12345678-123');
    expect(result.draft.counter).toBe('12/34');
    expect(result.draft.suffix).toBe('PR');
    expect(result.draft.dateTime).toBe('10.10.2026. 14:35:12');
    expect(result.draft.totalAmount).toBe('100,00');
  });

  it('does not substitute O for 0 in numeric fields or accept invalid dates', () => {
    const result = parseReceipt(lines(['ABCDEFGH-12345678-O23', '12/34', '31.02.2026. 12:00', 'Ukupan iznos: 1OO,00']));
    expect(result.draft.invoiceNumber).toBe('');
    expect(result.draft.totalAmount).toBe('');
    expect(result.draft.dateTime).toBe('');
    expect(result.draft.suffix).toBe('');
  });

  it('collapses equivalent duplicate total formatting', () => {
    const result = parseReceipt(lines(['Ukupan iznos: 1.234,50', 'Укупан износ: 1234.50']));
    expect(result.draft.totalAmount).toBe('1234.50');
    expect(result.ambiguous).not.toContain('totalAmount');
  });

  it('ignores footer document references containing three slash-separated parts', () => {
    const result = parseReceipt(lines(['Brojač: 20004/20399ПП', '535069/01/30']));
    expect(result.draft.counter).toBe('20004/20399');
    expect(result.draft.suffix).toBe('PP');
    expect(result.ambiguous).not.toContain('counter');
  });

  it('joins adjacent slanted date fragments without inventing digit corrections', () => {
    const result = parseReceipt([
      { text: '03.10', x: 0.42, y: 0.51, width: 0.06, height: 0.017 },
      { text: '2026.', x: 0.49, y: 0.499, width: 0.062, height: 0.021 },
      { text: '18:17:35', x: 0.552, y: 0.485, width: 0.105, height: 0.025 },
    ]);
    expect(result.draft.dateTime).toBe('03.10.2026. 18:17:35');
    expect(parseReceipt(lines(['03.10.2026.18:17:35'])).draft.dateTime).toBe('03.10.2026. 18:17:35');
  });
});
