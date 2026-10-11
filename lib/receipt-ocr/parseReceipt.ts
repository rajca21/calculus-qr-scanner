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

type DateCandidate = { value: string; box: OcrLine };
const invoicePattern = /\b([A-Z0-9]{8})\s*[-‐–—]\s*([A-Z0-9]{8})\s*[-‐–—]\s*([1-9]\d*)\b/gi;
const counterPattern = /(?<![\d/])\b(\d+)\s*\/\s*(\d+)(?![\d/])\s*([A-ZА-Я]{2})?(?![A-ZА-Я])/gi;
const datePattern = /\b(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})\.?/g;
const timePattern = /\b(\d{1,2})\s*[:：.]\s*(\d{2})(?:\s*[:：.]\s*(\d{2}))?\b/g;
const centerX = (line: OcrLine) => line.x + line.width / 2;
const centerY = (line: OcrLine) => line.y + line.height / 2;
const median = (values: number[]) => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

function union(a: OcrLine, b: OcrLine): OcrLine {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { text: `${a.text} ${b.text}`, x, y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y };
}

function datesFromLines(lines: OcrLine[]): DateCandidate[] {
  const dates: DateCandidate[] = [];
  const add = (day: string, month: string, year: string, time: string[], box: OcrLine) => {
    const value = `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}. ${time.map((part) => part.padStart(2, '0')).join(':')}`;
    if (normalizeReceiptDate(value)) dates.push({ value, box });
  };
  const times = lines.flatMap((line) => Array.from(line.text.matchAll(timePattern), (match) => ({ line, match })));
  const nearby = (a: OcrLine, b: OcrLine) => {
    const gap = b.x - a.x - a.width;
    return (gap >= -0.02 && gap < 0.14 && Math.abs(centerY(b) - centerY(a)) < Math.max(a.height, b.height) * 3) ||
      (Math.abs(b.x - a.x) < 0.08 && b.y >= a.y + a.height * 0.7 && b.y - a.y - a.height < 0.03);
  };
  for (const line of lines) {
    for (const date of line.text.matchAll(datePattern)) {
      // Time must follow the date on this line, or belong to an adjacent OCR fragment.
      const sameLine = times.filter((time) => time.line === line && time.match.index >= date.index + date[0].length);
      const adjacent = sameLine.length ? [] : times.filter((time) => time.line !== line && nearby(line, time.line));
      for (const time of [...sameLine, ...adjacent])
        add(date[1], date[2], date[3], time.match.slice(1).filter(Boolean), union(line, time.line));
    }
    const partial = line.text.trim().match(/^(\d{1,2})\s*[./-]\s*(\d{1,2})[./-]?$/);
    if (!partial) continue;
    for (const year of lines.filter((other) => /^20\d{2}\.?$/.test(other.text.trim()) && nearby(line, other))) {
      for (const time of times.filter((item) => nearby(year, item.line)))
        add(partial[1], partial[2], year.text.trim().replace(/\.$/, ''), time.match.slice(1).filter(Boolean), union(union(line, year), time.line));
    }
  }
  return dates;
}

function dateLabel(text: string) {
  // Vision sometimes mixes visually identical Latin/Cyrillic letters in this label.
  return /(?:pfr\s*)?[vb][rp]eme\b/.test(labelText(text));
}

function rowGeometry(lines: OcrLine[], dates: DateCandidate[]) {
  const slopes: number[] = [];
  for (const label of lines) {
    const normalized = labelText(label.text);
    const invoiceLabel = /pfr\s+broj\b/.test(normalized);
    const counterLabel = /brojac\b/.test(normalized);
    let candidates: OcrLine[] = [];
    if (dateLabel(label.text)) candidates = dates.map((date) => date.box);
    else if (invoiceLabel && !Array.from(label.text.matchAll(invoicePattern)).length)
      candidates = lines.filter((line) => Array.from(line.text.matchAll(invoicePattern)).length === 1);
    else if (counterLabel && !Array.from(label.text.matchAll(counterPattern)).length)
      candidates = lines.filter((line) => Array.from(line.text.matchAll(counterPattern)).length === 1);
    const nearby = candidates.filter((value) => value !== label && value.x >= label.x + label.width * 0.7 &&
      centerX(value) - centerX(label) > 0.06 && Math.abs(centerY(value) - centerY(label)) < 0.18)
      .sort((a, b) => Math.abs(centerY(a) - centerY(label)) - Math.abs(centerY(b) - centerY(label)));
    // Multiple receipts/values cannot provide a reliable alignment anchor.
    if (nearby.length === 1) {
      const slope = (centerY(nearby[0]) - centerY(label)) / (centerX(nearby[0]) - centerX(label));
      if (Math.abs(slope) < 0.6) slopes.push(slope);
    }
  }
  const slope = median(slopes);
  const rowError = (a: OcrLine, b: OcrLine) => Math.abs(centerY(b) - centerY(a) - slope * (centerX(b) - centerX(a)));
  const glyphHeight = (line: OcrLine) => Math.max(0.008, line.height - Math.abs(slope) * line.width);
  const sameRow = (a: OcrLine, b: OcrLine) => rowError(a, b) <= Math.max(0.012, Math.min(glyphHeight(a), glyphHeight(b)) * 1.2);
  return { slope, anchored: !!slopes.length, rowError, sameRow };
}

function amountValues(text: string): string[] {
  const normalized = text.replace(/\s*([.,])\s*/g, '$1');
  return Array.from(normalized.matchAll(/(?<![\w.,+−-])(?:\d{1,3}(?:[., ]\d{3})+|\d+)[.,]\d{2}(?![\w.,])/g), (match) => match[0])
    .filter((value) => amountInMinorUnits(value) !== null);
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

  choose('invoiceNumber', Array.from(text.matchAll(invoicePattern),
    (match) => `${match[1]}-${match[2]}-${match[3]}`.toUpperCase()));

  const dates = datesFromLines(ordered);
  const geometry = rowGeometry(ordered, dates);
  const labelledDates = dates.filter((date) => ordered.some((label) => dateLabel(label.text) &&
    (label === date.box || date.box.text.includes(label.text) || (date.box.x >= label.x + label.width * 0.7 && geometry.sameRow(label, date.box)))));
  choose('dateTime', (labelledDates.length ? labelledDates : dates).map((date) => date.value));

  const counters = Array.from(text.matchAll(counterPattern));
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

  // Reassemble labels split into separate observations before matching their value.
  const labels = ordered.map((line) => {
    if (!/^ukupan\s*:?$/.test(labelText(line.text).trim())) return line;
    const next = ordered.find((other) => /^iznos\b/.test(labelText(other.text)) &&
      other.x >= line.x + line.width * 0.7 && other.x - line.x - line.width < 0.08 && geometry.sameRow(line, other));
    return next ? union(line, next) : line;
  });
  const totals: string[] = [];
  for (const line of labels) {
    if (!/ukupan\s*iznos\b/.test(labelText(line.text)) || /porez/.test(labelText(line.text))) continue;
    const taxFragment = ordered.some((other) => /^(?:poreza?|pdv|tax)\b/.test(labelText(other.text)) &&
      other.x >= line.x + line.width * 0.7 && other.x - line.x - line.width < 0.08 && geometry.sameRow(line, other));
    if (taxFragment) continue;
    const inline = amountValues(line.text);
    if (inline.length) { totals.push(...inline); continue; }
    // Without a fiscal alignment anchor, a visibly slanted label is unsafe to
    // match by Y alone: a tax amount on a different row can appear closest.
    const characters = line.text.replace(/\s/g, '').length;
    if (!geometry.anchored && line.height > line.width / Math.max(characters, 1) * 2.2) continue;
    const neighbors = ordered.filter((other) => other !== line && other.x >= line.x + line.width * 0.7 &&
      geometry.sameRow(line, other) && amountValues(other.text).length === 1 &&
      !/[a-zа-я]/i.test(other.text.replace(/(?:RSD|DIN|ДИН|ДИНАРА)/gi, '')))
      .sort((a, b) => geometry.rowError(line, a) - geometry.rowError(line, b));
    if (!neighbors.length) continue;
    // Keep multiple equally plausible amounts ambiguous instead of guessing.
    const best = geometry.rowError(line, neighbors[0]);
    totals.push(...neighbors.filter((other) => geometry.rowError(line, other) <= best + 0.003).flatMap((other) => amountValues(other.text)));
  }
  const distinctTotals = new Map<string, string>();
  totals.forEach((value) => distinctTotals.set(amountInMinorUnits(value)!, value));
  choose('totalAmount', [...distinctTotals.values()]);
  return { draft, missing: (Object.keys(draft) as Field[]).filter((field) => !draft[field]), ambiguous };
}
