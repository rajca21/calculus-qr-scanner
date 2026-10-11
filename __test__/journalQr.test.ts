import { fromByteArray, toByteArray } from 'base64-js';
import { runInNewContext } from 'node:vm';
import { buildJournalQrScript, decodeJournalQr } from '@/lib/journal-qr';
import fixtures from './fixtures/journal-qr.json';

// Synthetic QR matrices generated independently with toqr; no real receipt data.
function image(rows: string[], inverted = false) {
  const scale = 5;
  const padding = 4;
  const width = (rows.length + padding * 2) * scale;
  const gray = new Uint8Array(width * width);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const row = Math.floor(y / scale) - padding;
      const column = Math.floor(x / scale) - padding;
      const dark = rows[row]?.[column] === '1';
      gray[y * width + x] = dark !== inverted ? 0 : 255;
    }
  }
  return { width, height: width, pixels: fromByteArray(gray) };
}

describe('journal QR recovery', () => {
  it('decodes the canonical URL from rendered QR pixels, including inverted codes', () => {
    expect(decodeJournalQr(image(fixtures[0].rows))).toBe(fixtures[0].url);
    expect(decodeJournalQr(image(fixtures[0].rows, true))).toBe(fixtures[0].url);
  });

  it('rejects a decoded URL from a lookalike host', () => {
    expect(decodeJournalQr(image(fixtures[1].rows))).toBeNull();
  });

  it('rejects oversized, malformed, and non-QR messages before allocating an image', () => {
    for (const message of [null, {}, { width: 1025, height: 1025, pixels: '' },
      { width: 2, height: 2, pixels: 'AAAA' }, { width: -1, height: 2, pixels: '' },
      { width: 1, height: 1, pixels: '!!!!' }, { width: 1.5, height: 1, pixels: 'AAAA' }]) {
      expect(decodeJournalQr(message)).toBeNull();
    }
    expect(decodeJournalQr({ width: 32, height: 32, pixels: fromByteArray(new Uint8Array(1024).fill(255)) })).toBeNull();
  });

  it('does not extract pixels on a page outside the official origin', async () => {
    const postMessage = jest.fn();
    await runInNewContext(buildJournalQrScript(123), {
      location: { origin: 'https://evil.test' },
      window: { ReactNativeWebView: { postMessage } },
    });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('extracts a journal canvas and hands its QR pixels back to the app', async () => {
    const source = image(fixtures[0].rows);
    const gray = toByteArray(source.pixels);
    const journalCanvas = {
      id: 'journalQr', tagName: 'CANVAS', className: '', width: source.width, height: source.height,
      getAttribute: () => null,
      getBoundingClientRect: () => ({ width: source.width, height: source.height }),
    };
    const result = new Promise<unknown>((resolve) => {
      const browserWindow = {
        ReactNativeWebView: { postMessage: (payload: string) => {
          const message = JSON.parse(payload);
          resolve(message);
          browserWindow.__calculusQrReply?.(456, true);
        } },
        __calculusQrReply: undefined as undefined | ((id: number, found: boolean) => void),
      };
      runInNewContext(buildJournalQrScript(456), {
        location: { origin: 'https://suf.purs.gov.rs' }, window: browserWindow,
        getComputedStyle: () => ({ visibility: 'visible' }), HTMLImageElement: class {},
        Uint8Array, setTimeout, clearTimeout,
        btoa: (value: string) => Buffer.from(value, 'binary').toString('base64'),
        document: {
          querySelectorAll: () => [journalCanvas],
          createElement: () => {
            const canvas = { width: 0, height: 0, getContext: () => ({
              fillRect: () => {}, drawImage: () => {}, fillStyle: '',
              getImageData: () => {
                const rgba = new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(255);
                for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
                  const offset = ((y + 16) * canvas.width + x + 16) * 4;
                  rgba[offset] = rgba[offset + 1] = rgba[offset + 2] = gray[y * source.width + x];
                }
                return { data: rgba };
              },
            }) };
            return canvas;
          },
        },
      });
    });
    const message = await result;
    expect(message).toMatchObject({ type: 'journal-qr-pixels', requestId: 456 });
    expect(decodeJournalQr(message)).toBe(fixtures[0].url);
  });
});
