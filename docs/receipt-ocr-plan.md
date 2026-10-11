# Receipt OCR implementation plan

Research date: 2026-10-10.

## Implementation status

On-device OCR capture/import is now implemented with a local Expo module:
bundled ML Kit on Android and Apple Vision on iOS. The photo fills the editable
draft; missing/conflicting fields are highlighted, and the user reviews values
against the photo before verification. See [OCR testing instructions](receipt-ocr-testing.md)
for validation evidence, limitations, and installing a new development build.

The first manual-entry milestone is implemented: scanner/home entry points,
editable verification fields and suffix selection, official-page WebView prefill,
canonical receipt-link detection, pasted-link import, strict URL checks, and
invoice/amount comparison before the existing receipt preview. The user verified that manual entry,
embedded verification, and opening the result/journal work on their device.
The result page does not expose a canonical receipt link in that tested flow.

Journal recovery now has an explicit `Učitaj QR iz žurnala` action: rendered image,
canvas, and SVG candidates are converted locally to bounded grayscale pixels,
then decoded with jsQR. Candidates are processed sequentially and only official
receipt URLs are accepted. A screenshot/gallery QR import is available as a
fallback. Neither path needs a new native module. The recovered URL goes through
the existing official fetch and invoice/amount checks before saving.

The full-screen modal has its own SafeAreaProvider, explicit safe edges, and
bounded flex layouts for the form and WebView. Typecheck, lint, and 44 tests pass,
including synthetic QR decoding and a simulated journal-canvas bridge. The actual
journal extraction and safe-area layout still need device confirmation.

Two local receipt photos show Latin/Cyrillic labels and both `4.513,29` and
`30,698.40` amount formats. Money normalization supports both formats without
floating-point rounding. Do not include real receipt photos or their identifiers
in automated fixtures or logs.

## Recommended approach

Keep the existing live QR scanner. Add a receipt-photo fallback that first tries
to decode the QR from a better still image, then extracts verification fields with
on-device OCR. Users review/correct the fields before opening the official SUF
verification page. Recover the official verification URL, then reuse the existing
receipt preview, duplicate checks, storage, and export flow.

OCR cannot reconstruct missing QR modules or the fiscal digital signature from
the four printed fields. It supplies lookup details; SUF supplies the authoritative
result. Do not save/export an OCR draft as a verified receipt.

## Findings in this app

- `app/(root)/(tabs)/index.tsx` uses Expo Camera live QR detection and
  `Camera.scanFromURLAsync` for gallery images. An unsuccessful gallery scan
  currently stops with an alert.
- Android Expo Camera already uses ML Kit barcode scanning, verified in the
  installed native source. Switching to another ML Kit wrapper alone is not an
  established improvement.
- `lib/helpers.tsx:getReceiptDataFromTC` parses the official receipt HTML.
- `components/modals/ReceiptModal.tsx` stores the verification URL and official
  receipt data and prevents duplicate invoice numbers.
- `react-native-webview` is already installed. Native OCR is not installed.
- The current URL guard uses `startsWith`; replace it with parsed HTTPS host/path
  validation when adding the verification bridge.

## Verified SUF form details

Public GET inspection of https://suf.purs.gov.rs/verify and its script found:

| Printed data | Form field | Handling |
| --- | --- | --- |
| PFR broj računa | `InvoiceNumberSe` | Two 8-character alphanumeric sections and a numeric final section; preserve ambiguous letters/digits for review. |
| Brojač računa | `InvoiceCounter` | Preserve both numbers separated by `/`. |
| Counter suffix | `InvoiceCounterExtension` | Separate required selection; map Latin/Cyrillic suffixes according to actual receipt type. Never assume every receipt is PP. |
| Ukupan iznos | `TotalAmount` | Parse Serbian decimal/group separators; preserve exact decimal amount. |
| PFR vreme | `SdcDateTime` | Page currently uses `d.m.yyyy. HH:mm` and server time zone; retain printed seconds internally and verify submission formatting. Do not convert using the phone's time zone. |

The page posts to `/verify` and uses reCAPTCHA Enterprise. A raw background POST
is not a supported integration established by this research. An official public
lookup API has not been confirmed. No valid receipt was submitted during research,
so result-page navigation, journal QR representation, and URL extraction remain
unverified.

## Free OCR options

1. **Preferred starting point: ML Kit Text Recognition v2**, on Android and iOS,
   exposed through a small local Expo module. SDK processing is free and on-device.
   Bundle the Android Latin model for immediate offline OCR. Serbian Latin is
   supported; Cyrillic receipt labels need a separate benchmark/strategy rather
   than assuming support. Many required values are Latin alphanumerics/numbers,
   so field-format and spatial extraction may still work when labels are missed.
2. **Apple Vision on iOS**, behind the same TypeScript interface, is an alternative
   to benchmark. Query supported recognition languages on the target OS; do not
   promise Serbian Cyrillic support without checking it.
3. **Tesseract**, Apache-2.0, has Serbian Cyrillic and Latin trained models. Benchmark
   if Cyrillic recognition is insufficient. Native integration, model storage,
   speed, and recognition quality must be measured. A hosted implementation adds
   infrastructure costs even though the engine is free.

Prefer a small local Expo module to committing to an unverified community wrapper
on Expo 57 / React Native 0.86.3. A wrapper is acceptable only after checking its
license, maintenance, architecture compatibility, and successful builds on both
platforms. New native code needs development builds and new store binaries; it
cannot be shipped solely as a JavaScript update or tested in stock Expo Go.

## Delivery sequence and gates

### 1. Prove the verification handoff first

Use a real receipt with manually entered fields. Test the official page in a
WebView on Android and iPhone, including reCAPTCHA, cookies, validation errors,
the result page, and Žurnal. Pre-fill after page initialization, dispatch the
appropriate input/change events, and let the user press the official submit button.

Investigate the returned page for its canonical verification URL. If available,
return it to the app. Otherwise decode the journal QR image directly, accounting
for image/canvas rendering and session-bound resources. Do not make users point
the phone camera at its own screen. Test that the recovered URL can be fetched by
the existing app flow outside the WebView session.

If embedded verification is unsupported, preserve a usable fallback: open the
official page externally, provide copy controls for the reviewed fields, and
accept a copied official verification URL or a journal screenshot through the
existing image scanner. Do not bypass CAPTCHA. WebView automation is a fragile
website adapter, not a guaranteed API.

**Gate:** obtain the authoritative receipt and reusable verification URL on both
phones before treating the end-to-end OCR feature as proven.

### 2. Improve photo-based QR recovery

Add `QR kod nije čitljiv?` / `Skeniraj tekst računa` to the camera screen. Capture
a focused high-resolution still photo or select a gallery image. Allow cropping
without cutting away the QR quiet zone. Try the original first, then a bounded
set of crops/rotation/contrast variants. Preserve the original image. Offer flash,
zoom, and retake guidance. Benchmark a second decoder only if it demonstrably
recovers receipts the existing decoder misses.

### 3. Add native OCR and a deterministic field parser

Suggested layout:

- `modules/receipt-ocr/`: native text recognition, returning blocks/lines and boxes.
- `lib/receipt-ocr/types.ts`: draft fields, source spans, candidates, review status.
- `lib/receipt-ocr/parseReceipt.ts`: Latin/Cyrillic label matching, positional and
  format-based fallback, counter/suffix parsing, decimal/date normalization.
- `components/receipt-ocr/ReceiptCapture.tsx`: capture/import/crop/retake.
- `components/receipt-ocr/ReceiptReview.tsx`: editable fields and photo comparison.
- `components/receipt-ocr/ReceiptVerification.tsx`: official page and URL handoff.
- `lib/receipt-verification.ts`: shared verified URL loading and official parsing.

Avoid guessed corrections to PFR identifiers (O/0, I/1, B/8). Show ambiguous
candidates for user confirmation. Review status may be heuristic; do not present
it as calibrated OCR confidence when the platform does not provide that data.
Separate draft data from the existing persisted Receipt type.

### 4. Integrate user review and official verification

Flow: live QR → photo QR retry → OCR → editable review → official verification →
existing receipt preview → user adds receipt → existing export.

Review fields use the existing Rubik fonts and keyboard-safe scrolling. Include
`Proveri podatke`, `Ponovo fotografiši`, `Unesi ručno`, and clear errors for missing
fields, no match, network failure, and changed website structure. Manual entry
should remain available even if OCR cannot initialize. Pause live camera scanning
while processing; cancel stale work when the user exits.

Validate the bridge's source origin and message schema. Check recovered URLs with
`new URL`, exact approved HTTPS hostname, and observed verification path; recheck
redirects. Compare official invoice number and amount to the reviewed draft and
handle discrepancies before saving. Preserve existing DB selection requirements,
30-receipt limit, duplicate checks, and export contract.

Process photos locally, keep them temporary, remove them after completion/cancel,
and avoid receipt images, OCR text, or verification URLs in analytics/debug logs.
Network access is still required for official verification and export.

### 5. Validate before release

Benchmark 30–50 representative receipts: Latin/Cyrillic, different printers,
faded paper, folds, blur, perspective, long receipts, and sale/refund suffixes.
Record QR recovery, exact field accuracy, manual corrections, end-to-end success,
processing latency, and memory on a lower-end Android phone and an iPhone.

Use parser fixtures for decimal separators, dates, suffix mapping, ambiguous IDs,
missing/duplicate labels, and multiple receipts in an image. Test URL validation
and malformed WebView messages. Device-test permission denial, offline OCR,
verification outage, CAPTCHA, cancellation, retries, duplicates, and export.

**Acceptance:** confirmed receipt data comes from SUF; no fabricated identifiers,
unverified draft export, or silent wrong receipt imports. Set OCR accuracy targets
after the benchmark rather than promising an unsupported success percentage.

## Sources

- [Official verification form](https://suf.purs.gov.rs/verify)
- [Official form script](https://suf.purs.gov.rs/js/manual-invoice-verification.js)
- [TaxCore QR explanation](https://tap.suf.purs.gov.rs/help/view/598783764/QR-%D0%BA%D0%BE%D0%B4/sr-Cyrl-RS)
- [ML Kit pricing and on-device APIs](https://developers.google.com/ml-kit/guides)
- [ML Kit text recognition languages](https://developers.google.com/ml-kit/vision/text-recognition/v2/languages)
- [ML Kit barcode image guidelines](https://developers.google.com/ml-kit/vision/barcode-scanning/android)
- [Apple Vision text recognition](https://developer.apple.com/documentation/vision/recognizing-text-in-images)
- [Tesseract engine and license](https://github.com/tesseract-ocr/tesseract)
- [Tesseract language models](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html)
- [Expo local native modules](https://docs.expo.dev/modules/get-started/)
