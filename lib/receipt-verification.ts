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

export function validateVerificationDraft(
  draft: ReceiptVerificationDraft,
): string | null {
  if (
    !/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{8}-[1-9]\d*$/.test(
      draft.invoiceNumber.trim(),
    ) ||
    draft.invoiceNumber.trim().length > 40
  )
    return 'Unesite ispravan PFR broj računa (XXXXXXXX-XXXXXXXX-123).';
  if (
    !/^\d+\/\d+$/.test(draft.counter.trim()) ||
    draft.counter.trim().length > 30
  )
    return 'Unesite brojač računa u obliku 123/123.';
  if (!Object.hasOwn(COUNTER_SUFFIXES, draft.suffix))
    return 'Izaberite oznaku uz brojač računa.';
  if (amountInMinorUnits(draft.totalAmount) === null)
    return 'Unesite iznos, na primer 3.060,00 ili 3060.00.';
  if (!normalizeReceiptDate(draft.dateTime))
    return 'Unesite PFR vreme sa računa, na primer 10.10.2026. 14:35:12.';
  return null;
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
      function receiptUrl(value) {
        try {
          var url = new URL(value, location.href);
          return url.origin === location.origin && /^\\/v\\/?$/i.test(url.pathname) &&
            url.searchParams.get('vl') ? url.href : null;
        } catch (_) { return null; }
      }
      if (location.pathname.replace(/\\/$/, '') === '/verify' && document.getElementById('verifyForm')) {
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
      var sent = '';
      function findReceipt() {
        var candidate = receiptUrl(location.href);
        if (!candidate) {
          var links = document.querySelectorAll('a[href], link[rel="canonical"]');
          for (var i = 0; i < links.length; i++) {
            candidate = receiptUrl(links[i].href);
            if (candidate) break;
          }
        }
        if (candidate && candidate !== sent) { sent = candidate; send({ type: 'receipt-url', url: candidate }); }
      }
      findReceipt();
      window.__calculusReceiptObserver = new MutationObserver(findReceipt);
      window.__calculusReceiptObserver.observe(document.documentElement, { childList: true, subtree: true });
    })(); true;
  `;
}
