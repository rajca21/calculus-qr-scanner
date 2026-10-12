# Release 1.1.0

Prepared on October 11, 2026. EAS builds, store uploads, review, and public release are separate steps.

## Configuration and builds

| Setting | Value |
| --- | --- |
| Store version | `1.1.0` |
| Android version code | `8` |
| iOS build number | `8` |
| Package / bundle identifier | `com.calculus.calculuscitacfiskala` |
| Expo account | `nikolacalculusmd` |
| Production profile | `production` |
| Build image | `sdk-57` on both platforms |
| Version management | Local; increment build numbers manually for replacement builds |

- [Android production build](https://expo.dev/accounts/nikolacalculusmd/projects/calculus-citac-fiskala/builds/7fe84b05-fa0d-4842-94e4-c0692b571ffe)
- [iOS production build](https://expo.dev/accounts/nikolacalculusmd/projects/calculus-citac-fiskala/builds/3d772357-83a3-4aa6-a9f9-762a01dfd1d7)

The iOS build finished successfully; the Android build was still running at the most recent status check. Both use the existing store signing credentials. Check their status on the linked pages before downloading or submitting. No store submission or public rollout was triggered by the build command.

The iOS distribution certificate and provisioning profile used for this build expire on **October 23, 2026**. Renew signing credentials when preparing builds after that date; do not replace the existing Android upload keystore for an app update.

## What changed for release readiness

- `app.json`, `package.json`, and the package lock agree on version 1.1.0.
- Camera/photo permission descriptions now cover QR scanning and receipt OCR in all configured iOS localizations.
- Microphone access is disabled in both Expo camera plugins; Android also blocks `RECORD_AUDIO`, `READ_MEDIA_IMAGES`, and `READ_MEDIA_VIDEO`. Gallery import uses the system picker. Legacy storage permissions remain limited to Android API 32 and earlier by Expo's manifest.
- Production uses Expo's SDK 57 image and production environment, with Android App Bundle output. [Expo documents these build images](https://docs.expo.dev/build-reference/infrastructure/).
- Fresh native generation contains the seven configured valid locale folders and no `base.lproj`. This addresses the project configuration behind the earlier Apple locale warning; check the final Apple processing report as well.
- React Native's installed Android toolchain targets API 36. Google currently requires API 36 or higher for updates. [Google's target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878).
- Apple's current submission minimum is Xcode 26 / iOS 26 SDK. The selected EAS SDK 57 image satisfies that toolchain requirement. [Apple's SDK requirements](https://developer.apple.com/news/upcoming-requirements/?id=02032026a).

## Validation and device testing

Completed: typecheck, lint, 71 unit tests, all 21 Expo Doctor checks, online Expo dependency compatibility, production Android/iOS/web JavaScript exports, and isolated native prebuild. OCR module source is included in the project; local receipt examples and ignored native project folders are excluded from the EAS upload.

The finished iOS IPA was inspected: version `1.1.0`, build `8`, iOS SDK `26.5`, minimum iOS `16.4`, OCR module linked, no microphone permission, and no lowercase `base.lproj`. Native production compilation is tracked on the build pages. Passing JavaScript checks or prebuild does not establish that the compiled application works on a phone.

Before releasing, install the exact binaries through Google Play internal testing and TestFlight and check:

1. Upgrade over the current store version; verify saved login and database selection.
2. Login/register, keyboard scrolling, loading buttons, connection failure and retry.
3. QR scanning, gallery QR import, permission denial, cancellation, camera reopening.
4. OCR camera and gallery on both platforms; Latin and Cyrillic receipts, total and date/time, field warnings, date mask, and PP dropdown. Check every recognized value against the receipt.
5. Ten-second camera hint, dismissal on scan/button interaction, and arrow placement on different screen sizes.
6. TaxCore prefilling, CAPTCHA, rejected submissions, correction of fields, result instructions, and scrolling to Žurnal.
7. Journal QR recovery directly adds the receipt and returns to the scanner. Verify duplicate handling, 30-receipt limit, and network failures.
8. Export to a test database; account deletion, logout, and background/resume.
9. Play Console bundle validation, including 16 KB page-size support. Confirm the finished binary passes Play's checks; framework versions alone are not proof for every bundled native library. [Android's page-size guidance](https://developer.android.com/guide/practices/page-sizes).

## Store declarations to review before submission

### Privacy policy and data forms

Update the published privacy policy to describe receipt OCR, official verification, and SDK diagnostics. Keep the policy URL working in both store listings. This release guide is not a replacement for that public policy.

| Data flow found in this app | What to review |
| --- | --- |
| Receipt photograph → local Apple Vision / bundled Android ML Kit | Images are processed on the device; this code does not upload receipt photos to a cloud OCR service. Picker cache copies are cleaned up when replaced or the OCR form closes. |
| Receipt fields → `suf.purs.gov.rs` | Verification sends invoice number, counter, total and date/time to the official TaxCore website. Its embedded CAPTCHA and site privacy practices also apply. |
| Receipt URLs / account / selected database → Calculus backend on export | Review receipt/purchase content, user identifiers and existing account disclosures. Confirm retention, sharing, and deletion practices with the backend owner. |
| Registration/login → Calculus backend | Existing email, contact, company name, PIB, account identifiers, and authentication data still require the applicable disclosures. OCR does not make the app a “no data collected” app. |
| Android ML Kit diagnostics | Review **Diagnostics / Other app performance data** and **Device or other IDs**, with analytics purposes, against Google's SDK disclosure guide. Account for the existing barcode SDK as well as the new text SDK. |

Only-on-device OCR images are outside collected-data declarations under [Google's Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469) and [Apple's privacy guidance](https://developer.apple.com/app-store/app-privacy-details/). Resulting data sent off the phone is a separate flow and must be assessed.

Google documents that ML Kit sends diagnostic/usage data, including installation identifiers, device/app information, performance, error and configuration metrics. Its published guide distinguishes data collection from third-party sharing; use the actual SDK version, applicable service-provider rules, and backend behavior to complete the form. [ML Kit's Android data disclosure guide](https://developers.google.com/ml-kit/android-data-disclosure?hl=en).

Suggested Serbian addition to the existing privacy policy, subject to confirming your backend practices:

> Fotografije fiskalnih računa obrađuju se na uređaju radi prepoznavanja teksta (OCR) i ne šalju se servisu za prepoznavanje teksta u oblaku. Privremene kopije fotografija brišu se pri zameni fotografije ili zatvaranju OCR obrasca. Pri proveri računa podaci se prosleđuju zvaničnoj stranici Poreske uprave, a pri izvozu podaci računa prosleđuju se Calculus sistemu i izabranoj bazi. Na Android uređajima Google ML Kit može slati Google-u dijagnostičke podatke i podatke o korišćenju, uključujući podatke o uređaju i aplikaciji, identifikator instalacije i metrike rada SDK-a. Za pitanja o obradi podataka kontaktirajte podrska@calculus.rs.

Do not claim that all network data is unretained, or that no data is shared, without checking the backend and TaxCore practices.

### Access, permissions, and listing information

- **Play Console → App content → App access:** provide a functioning reviewer account, accessible test database, and steps to use QR/OCR/export. Update those instructions to include the new OCR entry point.
- **Apple → App Review Information:** provide the reviewer account privately, a working backend and selected database, and a receipt image suitable for testing. Do not put credentials in public release notes or commit them to the repository.
- **Play photo/video declaration:** the release blocks the broad `READ_MEDIA_IMAGES/VIDEO` permissions. Verify the uploaded bundle's actual permissions; it should use selected-image picker access. [Google's photo permission guidance](https://support.google.com/googleplay/android-developer/answer/16935362).
- Confirm the existing public account-deletion URL in Play Console still works. Account deletion is already available in the profile screen; verify it against a disposable test account.
- Update screenshots if the current listing would misrepresent the scanner or OCR screens. Mention OCR in the full description using the text below.
- Check Apple's updated age-rating questionnaire and any pending agreements. OCR alone does not justify changing the app's content rating; answer according to the actual app and available web content.
- iOS privacy manifests generated by dependencies do not replace App Store Connect App Privacy answers. Local iOS OCR uses Apple Vision, not ML Kit.

## Google Play submission

1. Wait for the Android build to show **Finished**, then download its `.aab`.
2. Open [Play Console](https://play.google.com/console) and the existing Calculus app with the package above.
3. In **Testing → Internal testing**, create a release, upload the bundle, and confirm **1.1.0 / code 8**.
4. Enter release notes, review the bundle checks and required declarations, and roll out to internal testers.
5. Install through the tester opt-in link and complete the device checklist.
6. Create a Production release using the already-tested bundle, or promote the internal release. Start with a staged rollout if appropriate.
7. Complete **Publishing overview → Send changes for review** when shown. With managed publishing enabled, publish approved changes when ready; otherwise approved changes may go live automatically. [Google's release guide](https://support.google.com/googleplay/android-developer/answer/9859348).

Manual `.aab` upload does not require a Google service-account key. Keep the tested artifact; a replacement requires a higher version code.

## Apple upload and submission

After the iOS build finishes, upload this exact build:

```sh
npx eas-cli@latest submit --platform ios --profile production --id 3d772357-83a3-4aa6-a9f9-762a01dfd1d7
```

Select the existing App Store Connect app and the existing API key/account. If prompted for `ascAppId`, use the numeric Apple ID from the existing app's App Information page, not its bundle identifier. Alternatively, download the `.ipa` and deliver it through Apple's Transporter app. [Expo's iOS submission guide](https://docs.expo.dev/submit/ios/).

1. In [App Store Connect](https://appstoreconnect.apple.com), open **TestFlight** and wait for **1.1.0 (8)** to process.
2. Resolve processing/compliance issues, add the build to internal testers, and run the device checklist. The encryption configuration declares no non-exempt encryption; confirm this still matches the app.
3. Create **iOS version 1.1.0** in the App Store/Distribution section of the existing app record. Uploading an IPA does not create or release this version automatically.
4. Add What's New, select **1.1.0 (8)** in the Build section, and update privacy information, screenshots and review access details.
5. Choose manual or automatic release. Manual release lets you coordinate the launch with Google Play.
6. Click **Add for Review**, then **Submit for Review** in the submission. Release after approval if manual release was selected. [Apple's submission guide](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/).

Suggested private review notes (fill login fields in App Store Connect, not here):

```text
Version 1.1.0 adds on-device receipt OCR to the existing QR receipt scanner.
Sign in using the supplied review account and select the supplied test database.
Open the scanner from the home screen. Tap the document scanner icon above the
gallery icon to open OCR skener računa. Camera and Gallery populate the editable
fiscal receipt fields. OCR results must be reviewed and corrected before proceeding.
Proveri na Poreskoj upravi opens the official Serbian TaxCore verification page.
Complete missing fields/CAPTCHA and press Pošalji. Open Žurnal, scroll to its QR,
and tap Učitaj QR iz žurnala to add the verified receipt to the scanner list.
Images are recognized locally using Apple Vision on iOS.
The official verification page requires internet and a valid Serbian fiscal receipt.
Account deletion is available in the profile/settings screen.
```

## Release notes and listing copy

Serbian notes for the Google Play listing:

```text
Novo u verziji 1.1.0:
• OCR skener fiskalnih računa: fotografišite račun ili izaberite sliku iz galerije kada QR kod nije čitljiv.
• Automatsko popunjavanje podataka računa uz mogućnost ručne provere i ispravke.
• Poboljšano prepoznavanje ukupnog iznosa, datuma i vremena.
• Jednostavnija provera na Poreskoj upravi i učitavanje QR koda iz žurnala.
• Jasnija uputstva, provera formata polja i lakši unos datuma i vremena.
• Poboljšanja stabilnosti i korisničkog iskustva.
```

English notes for an English App Store listing (also suitable for Google Play's English localization):

Apple does not currently offer Serbian as an App Store metadata localization. Use
the language of your existing listing; the English version below is prepared for
an English listing. This is separate from the app's supported permission-string
localizations. [Apple's supported store localizations](https://developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations/).

```text
New in version 1.1.0:
• Scan fiscal receipt text from a photo or gallery image when its QR code is unreadable.
• Automatically fill receipt details, then review and correct them before verification.
• Improved total amount, date and time recognition.
• Easier official receipt verification and QR import from the receipt journal.
• Clearer guidance, field validation and masked date/time entry.
• Stability and usability improvements.
```

Serbian full-description addition:

```text
QR kod na računu nije čitljiv? Otvorite OCR skener iz kamere, fotografišite fiskalni račun ili izaberite njegovu sliku iz galerije. Aplikacija pokušava da prepozna PFR broj, brojač računa, ukupan iznos i datum i vreme. Proverite prepoznate podatke, dopunite ih po potrebi i nastavite proveru na zvaničnoj stranici Poreske uprave. Nakon provere učitajte QR kod iz žurnala i dodajte račun u listu za izvoz u Calculus bazu.

Prepoznavanje teksta obavlja se na uređaju. Za proveru i izvoz računa potrebna je internet veza. Tačnost prepoznavanja zavisi od čitljivosti i kvaliteta fotografije.
```

## Rebuilds and commit message

Keep marketing version `1.1.0` for a replacement release candidate. Increase the affected platform's number above **8** before rebuilding, and submit the new build ID. Local version management does not increment automatically. [Expo's versioning guide](https://docs.expo.dev/build-reference/app-versions/).

```sh
npx eas-cli@latest build --platform all --profile production
```

```text
chore: prepare version 1.1.0 for App Store and Google Play

- Bump app version and platform build numbers
- Update localized QR and OCR permission descriptions
- Remove unused microphone and broad media permissions
- Configure SDK 57 production builds and document store submission
```
