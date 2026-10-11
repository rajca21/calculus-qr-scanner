# Receipt OCR: implementation and testing

## User flow

Open **Unesi račun bez QR koda** (or **QR kod nije čitljiv?** from the scanner).
Choose **Fotografiši račun**, aim at the section containing the total and fiscal
verification fields, and take a focused still photo. **Izaberi sliku računa** also
supports existing photos.

The app fills PFR broj računa, PFR vreme, Brojač računa, its suffix, and Ukupan
iznos. Compare every field to the photo, correct errors, and fill missing fields
highlighted in amber. A retake replaces the entire draft so different receipts
cannot be mixed. Then use the existing official verification and journal QR flow.

## Native engines

- Android: bundled ML Kit Latin text recognition 16.0.1, through a local Expo
  module. No model download, cloud OCR service, or API key is required.
- iOS: Apple Vision accurate text recognition, through the same local module.
  Supported recognition languages are queried on the installed OS. English and
  Russian are selected where available to assist Latin identifiers and Cyrillic
  labels. Serbian Cyrillic accuracy is not guaranteed.
- Camera/gallery permission denial and recognition failures keep manual entry
  available. Stock Expo Go and older app binaries show a message explaining that
  a new OCR-enabled installation is required.
- Captures are processed on the device. The app deletes its picker cache copies
  after replacement or closing the form; it does not delete original gallery
  photos. Recognized text and receipt images are not logged or sent to an OCR
  service. Official verification still needs internet.

## Install an OCR-enabled development build

The new native module cannot be loaded by refreshing Expo Go or an old binary.
`expo-dev-client` is installed and the existing `development` EAS profile is ready.

```sh
npx eas-cli@latest build --profile development --platform all
```

Follow EAS signing prompts. For iPhone, register the device if requested for
internal distribution. Install the finished development builds using their EAS
links. Then start Metro:

```sh
npx expo start --dev-client
```

Open the project in the installed development app. Future JavaScript/form/parser
changes can refresh normally; changes to Swift/Kotlin or native dependencies need
another native build. Store version/build counters have not been changed in this
feature commit; increment them when preparing the next store release.

Local iOS builds need an Xcode version compatible with Expo SDK 57 (the installed
Xcode 26.2 is older than its requirement). No local Android SDK was found during
implementation. Use EAS for the development builds unless updating local tools.

## Validation completed

- Typecheck and lint pass.
- 54 tests pass, including Cyrillic/Latin labels, decimal formats, neighboring
  amount values, date fragments, suffixes, missing labels, and multiple receipts.
- Expo autolinking resolves ReceiptOcr for both platforms and reports no issues.
- Swift syntax parsing and fresh isolated native project generation pass.
- Apple Vision was run locally on the two supplied sample photos. Both populate
  all five draft fields after parser refinements. One sample misreads a printed
  time digit: population is not proof of exact OCR accuracy. Review is required.

Full Android/iOS app compilation and physical-device camera/OCR testing remain
to be performed with the development builds; a successful prebuild is not a
successful compiled native app.

## Device checks

1. Capture one receipt and compare every filled field with the original, including
   PFR identifier letters/digits and time seconds.
2. Try the Latin and Cyrillic sample photos from the gallery. Check a faded or
   angled photo, then retake with better focus and lighting.
3. Test totals using `4.513,29` and `30,698.40`; ensure cash, change, and tax totals
   do not overwrite the receipt total.
4. Photograph two receipts together: conflicting fields should remain empty for
   correction, rather than combining their values.
5. Deny camera permission, cancel capture/gallery selection, and test offline
   recognition. Manual entry should remain usable.
6. Start from the live QR scanner: its camera is released before opening receipt
   photo capture. Verify safe areas and keyboard scrolling on both platforms.
7. Complete official verification, recover the journal QR, preview/save the
   receipt, check duplicate handling, and export to a test database.

## Sources

- [Expo local native modules](https://docs.expo.dev/modules/get-started/)
- [ML Kit Android text recognition](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- [Apple text recognition](https://developer.apple.com/documentation/vision/vnrecognizetextrequest)
