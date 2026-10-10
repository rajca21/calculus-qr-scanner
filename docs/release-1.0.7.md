# Release 1.0.7

Prepared on 2026-10-10. Store uploads and publication are separate from EAS builds.

## Release configuration

| Setting | Value |
| --- | --- |
| Store version | `1.0.7` |
| Android version code | `7` |
| iOS build number | `7` |
| Android package / iOS bundle ID | `com.calculus.calculuscitacfiskala` |
| Expo account | `nikolacalculusmd` |
| EAS build profile | `production` |
| Expo SDK | `57` |

`app.json`, `package.json`, and `package-lock.json` agree on version 1.0.7.
EAS uses local version values, Node 22.20.0, and produces an Android App Bundle.
Android uses the standard `medium` worker supported by the current Expo account.
The ignored local `ios/` project is not uploaded; EAS generates the native projects.

The previous EAS builds used build number/code 6. If a build made outside EAS
already used Android code 7, increment the code before rebuilding.

## Store builds for this release

- [Android production build](https://expo.dev/accounts/nikolacalculusmd/projects/calculus-citac-fiskala/builds/39089f8c-ab9a-406c-8ee2-29dc2a5a046e)
- [iOS production build](https://expo.dev/accounts/nikolacalculusmd/projects/calculus-citac-fiskala/builds/ab557bdd-f8e8-4b7f-87f2-89032f808e94)

Both production builds finished successfully on October 10, 2026, with version
**1.0.7** and build number/version code **7**. The Android `.aab` and iOS `.ipa`
are ready to download or submit. Neither build has been uploaded to the stores
by this release workflow yet.
EAS reused the existing Android keystore and iOS distribution credentials.
Apple provisioning validation returned an error, but EAS accepted the locally
validated profile and continued. The iOS native build finished successfully.
The current iOS signing credentials expire on October 23, 2026; renew them if a
later build reports expired credentials.

## Validation and device checks

Typecheck, lint, 13 unit tests, 21 Expo Doctor checks, Expo dependency compatibility,
and Android/iOS/web production JavaScript exports passed before building.

Install the production builds through Play internal testing and TestFlight. Check
both Android and iPhone before production release:

1. Upgrade over the installed store version and confirm saved login and database selection survive.
2. Cold launch, connection checks, session restore, and retry after a network failure.
3. Login and registration: keyboard positioning, scrolling, password visibility, and loading buttons.
4. Camera scanning, camera permission denial, gallery QR scanning, and picker cancellation.
5. Receipt preview, duplicate handling, and export using a test database.
6. Profile editing, password changes, logout, and background/resume.

The SDK upgrade raises the minimum iOS version to 16.4. Native builds and device
checks are different from JavaScript bundle exports.

Android localization was corrected for SDK 57: the invalid `base` locale entry
was removed, and permission descriptions are now scoped to iOS. All seven iOS
translation dictionaries were verified unchanged. Fresh native project generation
confirmed Android receives no iOS permission strings and iOS still generates
all localized permission descriptions. The obsolete lint-disabling plugin was
removed. The Android link above points to the latest build with these fixes.

## Google Play: upload and test

1. Download the `.aab` from the finished Android build page.
2. Open [Google Play Console](https://play.google.com/console) and select the existing Calculus app with package `com.calculus.calculuscitacfiskala`.
3. Open **Test and release → Testing → Internal testing**, then **Create new release**.
4. Upload the `.aab`. Verify version name **1.0.7** and version code **7**.
5. Enter a release name such as `1.0.7 (7)` and the Serbian release notes below.
6. Save, review the release, resolve blocking errors, and publish it to the internal testing track using the actions shown by the console.
7. Add testers in the track's testers section, share the opt-in link, and install the update through Google Play on a real Android phone.

Manual upload does not require a Google service account key. Play Console supports
testing and production releases using App Bundles; see [Google's release guide](https://support.google.com/googleplay/android-developer/answer/9859348).

## Google Play: publish the tested build

1. Open **Test and release → Production** and create a release, or promote the tested internal release to Production if the console offers that action.
2. Select the already-uploaded bundle from the library. Use the same tested artifact; do not upload code 7 again as a different build.
3. Confirm release notes, countries, and any required declarations shown by the console. Review Data safety, App access, privacy policy, and permissions if the release requires updates.
4. Review the release and resolve blocking errors. For this SDK upgrade, a small staged rollout is a useful first step.
5. Complete **Publishing overview → Send changes for review** when shown. If managed publishing is enabled, publish the approved changes when ready; otherwise approved changes can go live automatically.
6. Monitor crash reports, login, scanning, and receipt exports before expanding the rollout.

The exact Save/Publish actions depend on review and publishing status. [Google explains the release and publishing flow](https://support.google.com/googleplay/android-developer/answer/9859348).

## iOS: upload the exact build

From the project directory, run:

```sh
npx eas-cli@latest submit --platform ios --profile production --id ab557bdd-f8e8-4b7f-87f2-89032f808e94
```

Use the existing App Store Connect app if prompted. Authenticate with the Apple
account/team that owns it, or select the existing EAS App Store Connect API key.
If prompted for an app ID, use the numeric **Apple ID** from the existing app's
**App Information** page, not its bundle identifier.

The upload appears in TestFlight after Apple processes it. EAS Submit uploads
the binary; you still submit the version for App Review in App Store Connect.
[Expo's iOS submission guide](https://docs.expo.dev/submit/ios/) covers these steps.

If EAS submission fails because of Apple credentials, download the `.ipa` from
the finished iOS build page, open Apple's **Transporter** app on your Mac, sign in
with the owning Apple account, add the `.ipa`, and choose **Deliver**. Wait for
processing. This is an alternative upload path for the same artifact.
[Apple's upload guide](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds).

## iOS: test and submit for review

1. Open [App Store Connect](https://appstoreconnect.apple.com), select the existing Calculus app, and open **TestFlight**.
2. Wait until **1.0.7 (7)** has processed. Resolve any Missing Compliance prompt according to the app's encryption use; the current config declares no non-exempt encryption.
3. Add the build to an internal testing group and install it with TestFlight on a real iPhone. Complete the device checks above.
4. In the App Store/Distribution section, click **+** next to iOS, create version **1.0.7**, and enter What's New. The existing app record is reused. [Apple's new-version guide](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version).
5. In the new version's **Build** section, select **1.0.7 (7)** and save. [Apple's build-selection guide](https://developer.apple.com/help/app-store-connect/manage-builds/choose-a-build-to-submit/).
6. Review screenshots, privacy information, support URL, and App Review information. Provide a working review account and clear instructions for reaching login, scanning, and receipt functionality if these require credentials.
7. Choose manual or automatic release. Manual release gives you control over the launch after approval. [Apple's release options](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option/).
8. Click **Add for Review**, open the draft submission, then **Submit for Review**. Adding for review alone does not send it to Apple. [Apple's submission guide](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app).
9. Respond to any review feedback. If you chose manual release, release the approved version from App Store Connect when ready.

## Suggested Serbian release notes

```text
Poboljšali smo prijavu i registraciju, prikaz tastature i indikatore učitavanja.
Dodali smo jasniji prikaz provere konekcije i korisnije poruke kada server nije dostupan.
Ažurirali smo aplikaciju i biblioteke radi bolje stabilnosti i kompatibilnosti.
```

## Rebuilding after a fix

Keep store version `1.0.7` for another candidate of this release. Before creating
a replacement binary, increment the affected platform's number in `app.json`
(for example Android `versionCode: 8` or iOS `buildNumber: "8"`). This project uses
manual local versioning, so EAS does not increment them automatically.
[Expo's version management guide](https://docs.expo.dev/build-reference/app-versions/).

Then run the build for the changed platform, or both:

```sh
npx eas-cli@latest build --platform all --profile production
```

For a replacement iOS submission use the new build's ID, not the ID above. Commit
the version/configuration changes to preserve the release source. Keep the same
app identifiers and existing signing keys when shipping updates.
