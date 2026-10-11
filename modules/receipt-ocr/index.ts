import { requireOptionalNativeModule } from 'expo';

export type OcrLine = { text: string; x: number; y: number; width: number; height: number };
export type OcrResult = { lines: OcrLine[] };

const nativeModule = requireOptionalNativeModule<{ recognize(uri: string): Promise<OcrResult> }>('ReceiptOcr');

export function isReceiptOcrAvailable(): boolean {
  return !!nativeModule;
}

export async function recognizeReceipt(uri: string): Promise<OcrResult> {
  if (!nativeModule) throw new Error('OCR zahteva novu instalaciju aplikacije sa OCR podrškom. Ručni unos je i dalje dostupan.');
  if (!/^(file|content):\/\//.test(uri)) throw new Error('Izaberite fotografiju sa telefona.');
  return nativeModule.recognize(uri);
}
