export interface Receipt {
  docId: string;
  scannedReceipt: string;
  url: string;
  userId: string;
  exported: boolean;
  invoiceNumber: string;
  createdAt: Date;
  dataFromTC?: ReceiptDataFromTC;
}

export interface ReceiptView extends Receipt {
  checked: boolean;
}

export interface ReceiptDataFromTC {
  invoiceNumber?: string;
  shopName?: string;
  totalAmount?: string;
  sdcDateTime?: string;
  monospaceContent?: string;
}
