# Expo SDK 57 upgrade

Updated on 2026-10-10 from SDK 54 through SDK 55 and 56 to SDK 57.0.27
(the npm `latest` release at the time), React Native 0.86.3, and React 19.2.3.

## Dependency choices

- Expo and native packages follow `expo install --check` recommendations.
- NativeWind is updated to 4.2.7; Tailwind stays on its compatible 3.4 line.
- AsyncStorage stays at Expo's recommended 2.2.0, preserving the existing storage API.
- Babel 7, Jest 29, and TypeScript 6 follow the SDK's tooling requirements.
- Replaced the legacy keyboard-aware scroll view with Expo's recommended keyboard
  controller in login and registration, including its root provider.
- Removed unused Testing Library packages and the mismatched direct React test
  renderer dependency. `jest-expo` supplies its compatible renderer.
- Updated the image-picker API, removed obsolete app configuration, and replaced
  React Native's removed `StyleSheet.absoluteFillObject` API.
- Fixed a conditional hook in the database selector and adopted Reanimated's
  getter/setter API for shared animation values.

## Repeatable checks

Use Node.js 22.13 or newer (validation used Node.js 22.20.0):

```sh
npm ci
npm run typecheck
npm test
npm run lint
npx expo install --check
npx expo-doctor@latest
npx expo export --platform all
```

The three parser unit tests run without network access. The original public
TaxCore receipt check is retained separately:

```sh
npm run test:integration
```

It requires access to `suf.purs.gov.rs`. It uses Node HTTPS because Expo's Jest
preset mocks native fetch; it verifies the live HTML parser, not device networking.

Android, iOS, and web production exports and isolated native prebuild generation
passed during the upgrade. These are not native compilation or device tests.

## Native builds and release verification

- SDK 57 requires iOS 16.4+ and Xcode 26.4+. The local Xcode installation is 26.2,
  so iOS native compilation was not verified. No Android SDK was found at the
  standard local SDK path; Android native compilation was not verified either.
- The existing ignored `ios/` directory was preserved. Back up any manual native
  changes before running `npx expo prebuild`: SDK 57 regenerates native directories
  by default. The current local iOS project still needs regeneration for SDK 57.
- Build new native binaries for this SDK upgrade. The existing EAS `preview`
  profile can produce internal builds. The `development` profile additionally
  requires installing `expo-dev-client`, which this project does not currently use.
- App identity, store version 1.0.5, and build numbers 6 are unchanged. Increment
  store build numbers before submitting a release.

On both Android and iOS, verify:

1. Cold launch, splash screen, fonts, sign-in, registration, logout, and session restore.
2. Upgrade an existing installation and confirm stored account/database selection survives.
3. Login/registration keyboard scrolling, password fields, and form buttons.
4. Database selection, tab navigation, receipt drawers, and swipe-to-dismiss gestures.
5. Camera permission allow/deny, live QR scan, camera switching, and reopening the camera.
6. Gallery permission allow/deny, picker cancellation, QR image scanning, and invalid images.
7. Receipt parsing, duplicate handling, receipt preview, and export to a test ERP database.
8. Offline/server-error behavior, background/resume, and Android system-bar/keyboard insets.

## Remaining dependency advisories

After compatible transitive updates, `npm audit` reported 72 affected dependency
entries (52 high, 20 moderate; no critical). These entries include parent chains,
not 72 independent flaws. Advisory origins remaining in the tree include `braces`,
`decode-uri-component`, `node-forge`, `postcss-selector-parser`, `sprintf-js`, and
`uuid`. They affect Expo/Metro/Jest/Tailwind and related dependency chains.

No forced audit fix or unverified dependency overrides were applied: npm proposes
incompatible major upgrades and even an Expo downgrade for some findings. Review
these advisories before release and recheck for compatible upstream patches.

References: [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/),
[SDK 56 breaking changes](https://expo.dev/changelog/sdk-56),
[SDK 57 release notes](https://expo.dev/changelog/sdk-57).
