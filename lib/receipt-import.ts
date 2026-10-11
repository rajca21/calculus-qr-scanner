import { isOfficialReceiptUrl } from './receipt-verification';
import { Receipt, ReceiptDataFromTC } from './types/Receipt';
import { User } from './types/User';

/** Add a fetched, verified receipt using the same list and limits as the QR scanner. */
export function appendVerifiedReceipt(
  receipts: Receipt[], user: User | null, url: string, data: ReceiptDataFromTC,
): { receipts: Receipt[]; duplicate: boolean; error?: never } | { error: string } {
  if (!user?.uid || !user.selectedDB || !user.databases?.some((db) => db.serialNum === user.selectedDB))
    return { error: 'Molimo izaberite bazu za skeniranje pre učitavanja računa.' };
  if (!isOfficialReceiptUrl(url) || !data.invoiceNumber || !data.totalAmount || !data.sdcDateTime)
    return { error: 'Podaci računa nisu potpuni. Ponovo proverite račun na Poreskoj upravi.' };
  if (receipts.some((receipt) => receipt.invoiceNumber.toUpperCase() === data.invoiceNumber!.toUpperCase()))
    return { receipts, duplicate: true };
  if (receipts.length >= 30)
    return { error: 'Dozvoljeno je učitavanje maksimalno 30 računa odjednom! Izvezite postojeće račune i zatim nastavite učitavanje.' };
  return {
    duplicate: false,
    receipts: [...receipts, {
      docId: Date.now().toString(), url, userId: user.uid, exported: false,
      invoiceNumber: data.invoiceNumber, createdAt: new Date(), dataFromTC: data,
    }],
  };
}
