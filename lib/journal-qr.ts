import jsQR from 'jsqr';
import { toByteArray } from 'base64-js';
import { isOfficialReceiptUrl } from './receipt-verification';

const MAX_SIDE = 1024;
const MAX_PIXELS = MAX_SIDE * MAX_SIDE;

export function decodeJournalQr(message: unknown): string | null {
  if (!message || typeof message !== 'object') return null;
  const { width, height, pixels } = message as Record<string, unknown>;
  if (typeof width !== 'number' || typeof height !== 'number' ||
      !Number.isInteger(width) || !Number.isInteger(height) ||
      width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE ||
      typeof pixels !== 'string' || pixels.length !== 4 * Math.ceil(width * height / 3) ||
      pixels.length > 4 * Math.ceil(MAX_PIXELS / 3) || !/^[A-Za-z0-9+/]*={0,2}$/.test(pixels)) return null;
  try {
    const gray = toByteArray(pixels);
    if (gray.length !== width * height) return null;
    const rgba = new Uint8ClampedArray(gray.length * 4);
    for (let i = 0; i < gray.length; i++) {
      rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = gray[i];
      rgba[i * 4 + 3] = 255;
    }
    const result = jsQR(rgba, width, height, { inversionAttempts: 'attemptBoth' });
    return result && isOfficialReceiptUrl(result.data) ? result.data : null;
  } catch {
    return null;
  }
}

// Read the rendered journal assets in their existing browser session. No receipt
// image is uploaded, written to disk, or reconstructed from the printed fields.
export function buildJournalQrScript(requestId: number): string {
  return `
    (async function () {
      if (location.origin !== 'https://suf.purs.gov.rs') return;
      var requestId = ${requestId};
      function send(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ requestId: requestId }, message)));
      }
      function visible(element) {
        var rect = element.getBoundingClientRect();
        var style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
      }
      var candidates = Array.from(document.querySelectorAll('img, canvas, svg')).filter(function (element) {
        if (!visible(element)) return false;
        var width = element.naturalWidth || element.width.baseVal && element.width.baseVal.value || element.width || element.clientWidth;
        var height = element.naturalHeight || element.height.baseVal && element.height.baseVal.value || element.height || element.clientHeight;
        var hint = [element.id, element.getAttribute('src'), element.getAttribute('alt'), element.className.baseVal || element.className].join(' ');
        return /qr/i.test(hint) || (width >= 128 && height >= 128 && width / height >= 0.7 && width / height <= 1.4);
      }).sort(function (a, b) {
        function score(element) { return /qr/i.test([element.id, element.getAttribute('src'), element.getAttribute('alt')].join(' ')) ? 1 : 0; }
        return score(b) - score(a);
      }).slice(0, 8);
      try {
        for (var element of candidates) {
          try {
            var source = element;
            var objectUrl = null;
            if (element.tagName.toLowerCase() === 'svg') {
              var markup = new XMLSerializer().serializeToString(element);
              objectUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
              source = new Image();
              source.src = objectUrl;
            }
            try {
              if (source instanceof HTMLImageElement && (!source.complete || !source.naturalWidth)) {
                await Promise.race([source.decode(), new Promise(function (_, reject) { setTimeout(function () { reject(new Error('Image timeout')); }, 3000); })]);
              }
              var width = source.naturalWidth || source.width || source.clientWidth;
              var height = source.naturalHeight || source.height || source.clientHeight;
              if (!(width > 0 && height > 0)) continue;
              var scale = Math.min(1, 992 / Math.max(width, height));
              var canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(width * scale)) + 32;
              canvas.height = Math.max(1, Math.round(height * scale)) + 32;
              var context = canvas.getContext('2d');
              context.fillStyle = '#ffffff';
              context.fillRect(0, 0, canvas.width, canvas.height);
              context.drawImage(source, 16, 16, canvas.width - 32, canvas.height - 32);
              var rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
              var bytes = new Uint8Array(canvas.width * canvas.height);
              for (var i = 0; i < bytes.length; i++) bytes[i] = Math.round((rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2]) / 3);
              var chunks = [];
              for (var start = 0; start < bytes.length; start += 8192) chunks.push(String.fromCharCode.apply(null, bytes.subarray(start, start + 8192)));
              var reply = new Promise(function (resolve) {
                var timer = setTimeout(function () { resolve(false); }, 6000);
                window.__calculusQrReply = function (id, found) {
                  if (id !== requestId) return;
                  clearTimeout(timer);
                  resolve(found);
                };
              });
              send({ type: 'journal-qr-pixels', width: canvas.width, height: canvas.height, pixels: btoa(chunks.join('')) });
              if (await reply) return;
            } finally {
              if (objectUrl) URL.revokeObjectURL(objectUrl);
            }
          } catch (_) { /* A blocked image/canvas should not stop the other candidates. */ }
        }
        send({ type: 'journal-qr-not-found' });
      } catch (_) {
        send({ type: 'journal-qr-not-found' });
      }
    })(); true;
  `;
}
