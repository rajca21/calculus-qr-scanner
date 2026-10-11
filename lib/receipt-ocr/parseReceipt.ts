import type { OcrLine } from '@/modules/receipt-ocr';
import { amountInMinorUnits, COUNTER_SUFFIXES, normalizeReceiptDate, ReceiptVerificationDraft } from '../receipt-verification';

type Field = keyof ReceiptVerificationDraft;
export type ParsedReceipt = { draft: ReceiptVerificationDraft; missing: Field[]; ambiguous: Field[] };

const cyrillic: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'dj', е: 'e', ж: 'z', з: 'z', и: 'i',
  ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', ћ: 'c', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz', ш: 's',
};

function labelText(text: string) {
  return text.toLowerCase().replace(/[а-яђјљњћџ]/g, (character) => cyrillic[character] ?? character)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

export function parseReceipt(lines: OcrLine[]): ParsedReceipt {
  const draft: ReceiptVerificationDraft = { invoiceNumber: '', counter: '', suffix: '', totalAmount: '', dateTime: '' };
  const ambiguous: Field[] = [];
  const ordered = lines.filter((line) => typeof line.text === 'string' && line.text.trim())
    .slice().sort((a, b) => a.y - b.y || a.x - b.x);
  const text = ordered.map((line) => line.text).join('\n');
  function choose(field: Field, values: string[]) {
    const unique = [...new Set(values)];
    if (unique.length === 1) draft[field] = unique[0];
    if (unique.length > 1) ambiguous.push(field);
  }

  choose('invoiceNumber', Array.from(text.matchAll(/\b([A-Z0-9]{8})\s*[-‐–—]\s*([A-Z0-9]{8})\s*[-‐–—]\s*([1-9]\d*)\b/gi),
    (match) => `${match[1]}-${match[2]}-${match[3]}`.toUpperCase()));

  const dates = Array.from(text.matchAll(/\b\d{1,2}\.\s*\d{1,2}\.\s*\d{4}(?:\.\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?\b/g),
    (match) => match[0].replace(/\.\s*/g, '.').replace(/(\d{4})\.(?=\d)/, '$1. '));
  // A tilted print can be recognized as three separate pieces of one date row.
  for (const datePart of ordered.filter((line) => /^\d{1,2}\.\d{1,2}\.?$/.test(line.text.trim()))) {
    const adjacent = (a: OcrLine, b: OcrLine) => b.x >= a.x + a.width * 0.7 &&
      b.x - a.x - a.width < 0.08 && Math.abs(b.y - a.y) < Math.max(a.height, b.height) * 3;
    for (const year of ordered.filter((line) => /^20\d{2}\.?$/.test(line.text.trim()) && adjacent(datePart, line))) {
      for (const time of ordered.filter((line) => /^\d{1,2}:\d{2}(?::\d{2})?$/.test(line.text.trim()) && adjacent(year, line))) {
        dates.push(`${datePart.text.trim().replace(/\.$/, '')}.${year.text.trim().replace(/\.$/, '')}. ${time.text.trim()}`);
      }
    }
  }
  choose('dateTime', dates.filter((value) => normalizeReceiptDate(value)));

  const counters = Array.from(text.matchAll(/(?<![\d/])\b(\d+)\s*\/\s*(\d+)(?![\d/])\s*([A-ZА-Я]{2})?(?![A-ZА-Я])/gi));
  choose('counter', counters.map((match) => `${match[1]}/${match[2]}`));
  if (draft.counter) {
    const suffixes = counters.flatMap((match) => {
      if (`${match[1]}/${match[2]}` !== draft.counter || !match[3]) return [];
      const suffix = match[3].toUpperCase();
      const key = Object.entries(COUNTER_SUFFIXES).find(([latin, cyrillic]) => suffix === latin || suffix === cyrillic)?.[0];
      return key ? [key] : [];
    });
    choose('suffix', suffixes);
  }

  // Only a labelled receipt total is eligible. VAT, cash tendered, change, and
  // item totals must never become the receipt total through a largest-number guess.
  const amounts = (value: string) => Array.from(value.matchAll(/\b\d+(?:[.,\s]\d+)*[.,]\d{2}\b/g), (match) => match[0].trim())
    .filter((value) => amountInMinorUnits(value) !== null);
  const totals: string[] = [];
  for (const line of ordered) {
    const label = labelText(line.text);
    if (!/ukupan\s+iznos\b/.test(label) || /porez/.test(label)) continue;
    const inline = amounts(line.text.slice(line.text.indexOf(':') + 1));
    if (inline.length) { totals.push(...inline); continue; }
    const neighbors = ordered.filter((other) => other !== line && other.x >= line.x + line.width * 0.7 &&
      Math.abs((other.y + other.height / 2) - (line.y + line.height / 2)) <= Math.max(line.height * 1.5, 0.025) && amounts(other.text).length === 1)
      .sort((a, b) => Math.abs(a.y - line.y) - Math.abs(b.y - line.y));
    if (neighbors.length) totals.push(...amounts(neighbors[0].text));
  }
  // Equivalent decimal formatting on duplicate OCR lines is not ambiguity.
  const distinctTotals = new Map<string, string>();
  totals.forEach((value) => distinctTotals.set(amountInMinorUnits(value)!, value));
  choose('totalAmount', [...distinctTotals.values()]);
  return { draft, missing: (Object.keys(draft) as Field[]).filter((field) => !draft[field]), ambiguous };
}
