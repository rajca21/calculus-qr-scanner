export interface Receipt {
  docId: string;
  scannedReceipt: string;
  url: string;
  userId: string;
  exported: boolean;
  invoiceNumber: string;
  createdAt: Date;
}

export interface ReceiptView extends Receipt {
  checked: boolean;
}
