export const VERIFICATION_PAGE = 'https://suf.purs.gov.rs/verify';

export type ReceiptVerificationDraft = {
  invoiceNumber: string;
  counter: string;
  suffix: string;
  totalAmount: string;
  dateTime: string;
};

export const COUNTER_SUFFIXES = {
  PP: 'ПП',
  PR: 'ПР',
  KP: 'КП',
  KR: 'КР',
  OP: 'ОП',
  OR: 'ОР',
  PD: 'ПД',
  RD: 'РД',
  AP: 'АП',
  AR: 'АР',
} as const;

// Keep money as decimal digits, never a rounded floating-point amount.
export function amountInMinorUnits(value: string): string | null {
  const text = value.trim().replace(/\s/g, '');
  let normalized = text;
  if (
    text.includes(',') &&
    text.includes('.') &&
    text.lastIndexOf('.') > text.lastIndexOf(',')
  ) {
    if (!/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(text)) return null;
    normalized = text.replace(/,/g, '');
  } else if (text.includes(',')) {
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(text)) return null;
    normalized = text.replace(/\./g, '').replace(',', '.');
  } else if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    return null;
  }
  const [whole, decimal = ''] = normalized.split('.');
  return `${whole}${decimal.padEnd(2, '0')}`.replace(/^0+(?=\d)/, '');
}

export function normalizeReceiptDate(value: string): string | null {
  const match = value
    .trim()
    .match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
    );
  if (!match) return null;
  const [, day, month, year, hour, minute, seconds = '0'] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day));
  if (
    +year < 2021 ||
    date.getUTCFullYear() !== +year ||
    date.getUTCMonth() !== +month - 1 ||
    date.getUTCDate() !== +day ||
    +hour > 23 ||
    +minute > 59 ||
    +seconds > 59
  )
    return null;
  // The official form currently accepts minutes. Preserve printed seconds in the draft.
  return `${+day}.${+month}.${year}. ${hour.padStart(2, '0')}:${minute}`;
}

export type VerificationErrors = Partial<Record<keyof ReceiptVerificationDraft, string>>;

export function getVerificationErrors(draft: ReceiptVerificationDraft): VerificationErrors {
  const errors: VerificationErrors = {};
  if (!/^[a-zA-Z0-9]+-[a-zA-Z0-9]+-\d+$/.test(draft.invoiceNumber.trim()))
    errors.invoiceNumber = 'Unesite PFR broj u obliku ABC-DEF-123.';
  if (!/^\d+\/\d+$/.test(draft.counter.trim()))
    errors.counter = 'Unesite brojač računa u obliku 123/123.';
  if (!Object.hasOwn(COUNTER_SUFFIXES, draft.suffix))
    errors.suffix = 'Izaberite oznaku uz brojač računa.';
  if (amountInMinorUnits(draft.totalAmount) === null)
    errors.totalAmount = 'Unesite iznos, na primer 3.060,00 ili 3060.00.';
  if (!normalizeReceiptDate(draft.dateTime))
    errors.dateTime = 'Unesite ispravan datum i vreme: DD.MM.GGGG. HH:mm:ss.';
  return errors;
}

export function validateVerificationDraft(draft: ReceiptVerificationDraft): string | null {
  return Object.values(getVerificationErrors(draft))[0] ?? null;
}

// Add separators only when the next digit exists, so backspace works naturally.
export function maskReceiptDate(value: string): string {
  const formatted = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  const digits = formatted
    ? formatted.slice(1).filter(Boolean).map((part, index) => index === 2 ? part : part.padStart(2, '0')).join('')
    : value.replace(/\D/g, '').slice(0, 14);
  return digits.split('').map((digit, index) => {
    const separator = ({ 2: '.', 4: '.', 8: '. ', 10: ':', 12: ':' } as Record<number, string>)[index] ?? '';
    return separator + digit;
  }).join('');
}

export function isOfficialReceiptUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'suf.purs.gov.rs' &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^\/v\/?$/i.test(url.pathname) &&
      !!url.searchParams.get('vl')?.trim()
    );
  } catch {
    return false;
  }
}

export function isOfficialPage(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'suf.purs.gov.rs' &&
      !url.port &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function buildVerificationScript(
  draft: ReceiptVerificationDraft,
  prefill = true,
): string {
  const fields = JSON.stringify({
    InvoiceNumberSe: draft.invoiceNumber.trim(),
    InvoiceCounter: draft.counter.trim(),
    InvoiceCounterExtension: COUNTER_SUFFIXES[draft.suffix],
    TotalAmount: (() => {
      const amount = amountInMinorUnits(draft.totalAmount)!.padStart(3, '0');
      return `${amount.slice(0, -2)},${amount.slice(-2)}`;
    })(),
    SdcDateTime: normalizeReceiptDate(draft.dateTime),
  }).replace(/</g, '\\u003c');
  return `
    (function () {
      if (location.origin !== 'https://suf.purs.gov.rs') return;
      function send(message) { window.ReactNativeWebView.postMessage(JSON.stringify(message)); }
      var form = document.getElementById('verifyForm');
      if (form) send({ type: 'verification-page', stage: 'form' });
      if (form && ${prefill} && !window.__calculusPrefilled) {
        window.__calculusPrefilled = true;
        var fields = ${fields};
        var attempts = 0;
        var timer = setInterval(function () {
          // Wait for the official page's date picker to initialize before prefilling.
          if (document.readyState !== 'complete' && ++attempts < 20) return;
          clearInterval(timer);
          var complete = true;
          Object.keys(fields).forEach(function (name) {
            var input = document.querySelector('[name="' + name + '"]');
            if (!input) { complete = false; return; }
            input.value = fields[name];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            if (input.value !== fields[name]) complete = false;
          });
          send({ type: complete ? 'prefilled' : 'unsupported' });
        }, 300);
      }
      if (window.__calculusReceiptObserver) window.__calculusReceiptObserver.disconnect();
      function detectResult() {
        var invoice = document.getElementById('invoiceNumberLabel');
        // The form can stay on /verify after failed validation. Only a receipt result advances the UI.
        if (!invoice || !invoice.textContent.trim()) return;
        var amount = document.getElementById('totalAmountLabel');
        send({ type: 'verification-page', stage: 'result', invoiceNumber: invoice.textContent.trim(),
          totalAmount: amount ? amount.textContent.trim() : '' });
        if (!window.__calculusResultScrolled) {
          window.__calculusResultScrolled = true;
          setTimeout(function () {
            window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
          }, 400);
        }
      }
      detectResult();
      window.__calculusReceiptObserver = new MutationObserver(detectResult);
      window.__calculusReceiptObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    })(); true;
  `;
}
