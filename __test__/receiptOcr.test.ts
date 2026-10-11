import { parseReceipt } from '@/lib/receipt-ocr/parseReceipt';
import type { OcrLine } from '@/modules/receipt-ocr';

const lines = (values: string[]): OcrLine[] => values.map((text, index) => ({ text, x: 0.1, y: index * 0.05, width: 0.8, height: 0.02 }));

describe('receipt OCR field extraction', () => {
  it('matches the tilted Latin total row instead of a tax value closer in image Y', () => {
    // Geometry follows the observed Vision layout; fiscal IDs are synthetic.
    const result = parseReceipt([
      { text: 'Ukupan iznos:', x: 0.131, y: 0.417, width: 0.138, height: 0.041 },
      { text: 'Gotovina:', x: 0.141, y: 0.448, width: 0.094, height: 0.030 },
      { text: '30,698.40', x: 0.457, y: 0.341, width: 0.099, height: 0.044 },
      { text: '30,698.40', x: 0.467, y: 0.364, width: 0.098, height: 0.042 },
      { text: '5,116.40', x: 0.510, y: 0.442, width: 0.090, height: 0.039 },
      { text: 'Ukupan iznos poreza:', x: 0.187, y: 0.548, width: 0.193, height: 0.057 },
      { text: 'PFR vreme:', x: 0.203, y: 0.602, width: 0.113, height: 0.038 },
      { text: '09.10.2026. 12:13:35', x: 0.446, y: 0.526, width: 0.197, height: 0.059 },
      { text: 'PFR broj racuna:', x: 0.210, y: 0.607, width: 0.159, height: 0.052 },
      { text: 'ABCDEFGH-12345678-1141', x: 0.359, y: 0.544, width: 0.290, height: 0.079 },
      { text: 'Brojac racuna:', x: 0.216, y: 0.626, width: 0.139, height: 0.050 },
      { text: '1088/1141ПП', x: 0.527, y: 0.561, width: 0.129, height: 0.042 },
    ]);
    expect(result.draft.totalAmount).toBe('30,698.40');
    expect(result.draft.dateTime).toBe('09.10.2026. 12:13:35');
    expect(result.missing).toEqual([]);
  });

  it('matches tilted Cyrillic totals with split date and mixed-alphabet time labels', () => {
    const result = parseReceipt([
      { text: 'Укупан износ:', x: 0.172, y: 0.418, width: 0.150, height: 0.032 },
      { text: '4.513,29', x: 0.534, y: 0.373, width: 0.098, height: 0.028 },
      { text: '675,72', x: 0.568, y: 0.432, width: 0.076, height: 0.022 },
      { text: 'ПФР', x: 0.192, y: 0.545, width: 0.037, height: 0.015 },
      { text: 'Bpeмe:', x: 0.225, y: 0.534, width: 0.086, height: 0.022 },
      { text: '03.10', x: 0.422, y: 0.510, width: 0.060, height: 0.017 },
      { text: '2026.', x: 0.490, y: 0.499, width: 0.062, height: 0.021 },
      { text: '16:17:35', x: 0.552, y: 0.485, width: 0.105, height: 0.025 },
    ]);
    expect(result.draft.totalAmount).toBe('4.513,29');
    expect(result.draft.dateTime).toBe('03.10.2026. 16:17:35');
  });

  test.each([
    ['PFR vreme: 9 / 10 / 2026 12 : 13 : 35', '09.10.2026. 12:13:35'],
    ['ПФР време: 09-10-2026 12.13.35', '09.10.2026. 12:13:35'],
    ['PFR vreme: 09. 10. 2026. 12：13：35', '09.10.2026. 12:13:35'],
  ])('normalizes OCR spacing and punctuation in %s', (text, expected) => {
    expect(parseReceipt(lines([text])).draft.dateTime).toBe(expected);
  });

  it('joins a full date and separate time despite intervening OCR observations', () => {
    const result = parseReceipt([
      { text: '09.10.2026.', x: 0.40, y: 0.51, width: 0.15, height: 0.025 },
      { text: 'PFR vreme:', x: 0.10, y: 0.52, width: 0.18, height: 0.03 },
      { text: '12 : 13 : 35', x: 0.56, y: 0.50, width: 0.12, height: 0.03 },
      { text: 'Printed: 08.10.2026. 11:00:00', x: 0.10, y: 0.8, width: 0.60, height: 0.02 },
    ]);
    expect(result.draft.dateTime).toBe('09.10.2026. 12:13:35');
    expect(result.ambiguous).not.toContain('dateTime');
  });

  it('handles separated total label words and decimal punctuation spaces', () => {
    const result = parseReceipt([
      { text: 'Укупан', x: 0.1, y: 0.5, width: 0.12, height: 0.02 },
      { text: 'износ:', x: 0.23, y: 0.5, width: 0.1, height: 0.02 },
      { text: '4 . 513 , 29 RSD', x: 0.65, y: 0.5, width: 0.25, height: 0.02 },
    ]);
    expect(result.draft.totalAmount).toBe('4.513,29');
    expect(parseReceipt(lines(['Ukupaniznos: 100,00'])).draft.totalAmount).toBe('100,00');
  });

  it('does not treat a split tax label, a negative amount, or ambiguous rows as a total', () => {
    const result = parseReceipt([
      { text: 'Ukupan', x: 0.1, y: 0.5, width: 0.10, height: 0.02 },
      { text: 'iznos', x: 0.21, y: 0.5, width: 0.10, height: 0.02 },
      { text: 'poreza:', x: 0.32, y: 0.5, width: 0.10, height: 0.02 },
      { text: '717,45', x: 0.65, y: 0.5, width: 0.20, height: 0.02 },
    ]);
    expect(result.draft.totalAmount).toBe('');
    expect(parseReceipt(lines(['Ukupan iznos: -100,00'])).draft.totalAmount).toBe('');
    const ambiguous = parseReceipt([
      { text: 'Ukupan iznos:', x: 0.1, y: 0.5, width: 0.30, height: 0.02 },
      { text: '100,00', x: 0.65, y: 0.5, width: 0.20, height: 0.02 },
      { text: '200,00', x: 0.65, y: 0.501, width: 0.20, height: 0.02 },
    ]);
    expect(ambiguous.draft.totalAmount).toBe('');
    expect(ambiguous.ambiguous).toContain('totalAmount');
  });

  it('keeps an unanchored slanted total empty rather than substituting the nearest tax row', () => {
    const result = parseReceipt([
      { text: 'Ukupan iznos:', x: 0.13, y: 0.417, width: 0.138, height: 0.041 },
      { text: '5,116.40', x: 0.510, y: 0.442, width: 0.090, height: 0.039 },
    ]);
    expect(result.draft.totalAmount).toBe('');
  });
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
