# ENGLISH MASTER Android app

This repository uses Capacitor to package the existing React + Vite app as an Android application.

## App identity

- Display name: ENGLISH MASTER
- Android application ID: com.englishmaster.app
- Web build directory: dist
- Native runtime: Capacitor 8

## Local build prerequisites

- Node.js 22+
- Android Studio with Android SDK
- Android SDK Platform and Build Tools

## Build commands

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

After the Android platform has been generated once, future web changes can be applied with:

```bash
npm run android:build
```

## Automated debug build

The GitHub Actions workflow at .github/workflows/android-debug.yml creates the Android project and builds an installable debug APK. It runs on pushes to the android-app-setup branch and can also be started manually from the Actions tab.

The debug APK is for device testing. A Google Play release requires a properly signed Android App Bundle (AAB), store listing assets, privacy disclosures, and completion of Google Play's current testing and developer-account requirements.

## Important integration checks before release

1. Test Google sign-in on a real Android device. The current website uses Google Identity Services in a browser; embedded WebViews can restrict this flow. If it fails, implement the supported native Google sign-in flow rather than weakening OAuth security.
2. Verify the profile welcome and admin endpoints. The website currently calls relative /api/profile/welcome and /api/admin/me paths; these must resolve correctly in the packaged app.
3. Verify session persistence, logout, navigation/back behavior, keyboard layout, microphone permissions, and external links.
4. Confirm privacy policy, data safety disclosures, age-appropriate store listing, app icon, splash screen, and support contact before publication.

Do not commit OAuth secrets, signing keys, passwords, or service credentials to this repository.
