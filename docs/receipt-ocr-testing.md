# Receipt OCR: implementation and testing

## User flow

Open the QR camera, then tap the **OCR document scanner icon above the gallery**.
After 10 seconds without scanning or interacting, the camera displays a Serbian
OCR hint with a curved arrow. Scanning any code or touching a camera control
cancels the hint for that session; reopening the camera starts a fresh timer.

The full-screen **OCR skener računa** sheet has Info, Camera, and Gallery icons.
Info expands the instructions. Camera and Gallery populate the form from a receipt
photo; manual entry remains available. The home-page OCR link and URL-entry screen
have been removed.

Compare the recognized fields with the photo. Invalid fields show individual
warnings after blur or submission. PFR identifiers use nonempty alphanumeric
segments followed by digits, with no fixed segment lengths; counters use digits /
digits. Date/time is masked as `DD.MM.GGGG. HH:mm:ss`, and the suffix dropdown
defaults to PP. A retake replaces the entire draft to avoid mixing receipts.

Submit the form to open official verification inside the safe area. Review or
complete the official fields and press **Pošalji**. Once receipt details appear,
the page scrolls to the bottom once and the instructions change to explain opening
**Žurnal**. Scroll until its QR is visible and tap **Učitaj QR iz žurnala**. The app
fetches the recovered official URL and adds the receipt directly to the existing
scanner list, then returns to the camera. There is no URL or preview step. Duplicate
receipts are not added, and the existing 30-receipt limit is enforced. Corrections
made on TaxCore are checked against the resulting official receipt details.

## Validation for the scanner and OCR parser updates

- Typecheck, lint, and 71 automated tests pass, including variable identifier
  lengths, masked typing/backspace/paste, field errors, result detection without
  a URL change, preserving TaxCore corrections, scrolling once, direct import,
  duplicates, the receipt limit, tilted monetary rows, split labels and date/time
  fragments, punctuation spacing, and rejection of tax/ambiguous amount matches.
- No native dependencies or native OCR code changed. Refresh the existing
  OCR-enabled development build through Metro; this update needs no native rebuild.
- Visual checks and the full live TaxCore flow on Android/iOS remain to be checked
  on devices. The simulator UI tool was unavailable during this update.

## Amount and date extraction improvements

OCR observations are not always horizontal rows. On tilted photos, comparing label
and value Y positions alone can select tax from a different row. The parser now
uses separately recognized fiscal labels and their known-format values to estimate
row slope before associating the receipt total. Split `Ukupan` / `iznos` labels are
joined, while tax labels remain excluded. Without a reliable alignment anchor, a
visibly tilted label stays unresolved rather than guessing a nearby amount.

Dates and times can be separate observations, including day/month, year, and time.
They are assembled using their positions instead of depending on the global OCR
line ordering. Spaces around punctuation, slash/dash date separators, full-width
colons, and dot-separated times are normalized and checked against real dates.
A date associated with the PFR time label takes priority over unrelated dates.
Numeric OCR character substitutions are not guessed.

Replaying the saved Vision observations from the two local sample photos now
extracts the printed totals `4.513,29` and `30,698.40`. The previous association
selected `675,72` and `5,116.40`, both tax values. Both dates populate, but the first
photo's recognized hour remains `18` although the original prints `16`. Parser
improvements cannot recover digits the engine misread; user review is required.
The samples remain local and receipt identifiers are not copied into fixtures.

Check new captures and gallery images on both platforms after refreshing Metro.
If fields remain empty, the failing photo/recognized layout is needed to distinguish
missing recognition from unsupported parsing. Focused region recognition and image
preprocessing can then be evaluated against those failures; native engine changes
would require a new development build.

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

## Earlier OCR engine validation

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
7. Leave the QR camera idle for 10 seconds. Check the hint and curved arrow on a
   small and large screen. Scan or press each camera control before and after the
   hint appears; it must disappear and stay dismissed until a fresh camera session.
8. Check field warnings with `A-B-123`, `1/123456789`, invalid dates, and malformed
   amounts. Type, delete, and paste a date; confirm PP is preselected and change it.
9. Complete official verification, including a rejected submission and corrections
   made on TaxCore. Check the initial/result instructions and one-time scrolling.
10. Recover the journal QR: the receipt must appear directly in the scanned list
    and the camera must reopen. Retry the same receipt, a full list of 30, and a
    network failure. Confirm there is no address-entry or screenshot-import step.
11. Export to a test database after checking the recovered receipt details.

## Sources

- [Expo local native modules](https://docs.expo.dev/modules/get-started/)
- [ML Kit Android text recognition](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- [Apple text recognition](https://developer.apple.com/documentation/vision/vnrecognizetextrequest)
