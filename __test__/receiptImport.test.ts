import { appendVerifiedReceipt } from '@/lib/receipt-import';
import { Receipt } from '@/lib/types/Receipt';
import { User } from '@/lib/types/User';

const user: User = {
  uid: 'test-user', email: '', companyName: '', contact: '', databases: [{ serialNum: 'test-db', name: 'Test' }],
  selectedDB: 'test-db', sessionToken: null, verified: true,
};
const url = 'https://suf.purs.gov.rs/v/?vl=synthetic';
const data = { invoiceNumber: 'ABC-DEF-123', totalAmount: '1.234,56', sdcDateTime: '10.10.2026. 14:35:12' };
const existing: Receipt = { docId: 'old', url, userId: user.uid, exported: false, invoiceNumber: 'OLD-ID-1', createdAt: new Date(0) };

describe('direct journal receipt import', () => {
  it('adds a first receipt and appends to the existing scanner list without modifying it', () => {
    for (const receipts of [[], [existing]]) {
      const result = appendVerifiedReceipt(receipts, user, url, data);
      expect('error' in result).toBe(false);
      if ('error' in result) throw new Error(result.error);
      expect(result.receipts).toHaveLength(receipts.length + 1);
      expect(result.receipts.at(-1)).toMatchObject({ url, userId: user.uid, exported: false, invoiceNumber: data.invoiceNumber, dataFromTC: data });
      expect(receipts).toHaveLength(receipts[0] ? 1 : 0);
    }
  });

  it('does not duplicate a receipt or exceed the 30 receipt limit', () => {
    const receipts = [{ ...existing, invoiceNumber: data.invoiceNumber.toLowerCase() }];
    expect(appendVerifiedReceipt(receipts, user, url, data)).toEqual({ receipts, duplicate: true });
    expect(appendVerifiedReceipt(Array(30).fill(existing), user, url, data)).toHaveProperty('error');
  });

  it('requires a signed-in user, valid selected database, official URL, and complete fetched receipt', () => {
    expect(appendVerifiedReceipt([], null, url, data)).toHaveProperty('error');
    expect(appendVerifiedReceipt([], { ...user, selectedDB: 'missing' }, url, data)).toHaveProperty('error');
    expect(appendVerifiedReceipt([], user, 'https://example.com/v/?vl=1', data)).toHaveProperty('error');
    expect(appendVerifiedReceipt([], user, url, { ...data, invoiceNumber: '' })).toHaveProperty('error');
  });
});
