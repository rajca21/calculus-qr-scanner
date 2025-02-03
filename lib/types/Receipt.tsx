export interface Receipt {
  docId: string;
  scannedReceipt: string;
  url: string;
  userId: string;
  exported: boolean;
  invoiceNumber: string;
}

export interface ReceiptView extends Receipt {
  checked: boolean;
}
