# Native Mobile App Setup Guide

Your app is now configured as a native mobile app using Capacitor! Follow these steps to run it on iOS or Android devices.

## Prerequisites

### For Android:
- [Android Studio](https://developer.android.com/studio) installed
- Android SDK configured

### For iOS (Mac only):
- macOS computer
- [Xcode](https://developer.apple.com/xcode/) installed
- iOS simulator or physical device

## Setup Steps

### 1. Export to GitHub
Click the "Export to GitHub" button in Lovable to transfer your project to your own GitHub repository.

### 2. Clone and Install Dependencies
```bash
git clone <your-github-repo-url>
cd <your-project-folder>
npm install
```

### 3. Add Native Platforms

For Android:
```bash
npx cap add android
npx cap update android
```

For iOS:
```bash
npx cap add ios
npx cap update ios
```

### 4. Build the Web Assets
```bash
npm run build
```

### 5. Sync with Native Projects
```bash
npx cap sync
```

**Important:** Run `npx cap sync` after every `git pull` to sync changes to native platforms.

### 6. Run on Device/Emulator

For Android:
```bash
npx cap run android
```

For iOS:
```bash
npx cap run ios
```

## Native Features Available

### 1. Advanced Haptics
Your app now uses native haptic feedback for:
- Light haptics for "pass" swipes
- Medium haptics for "like" swipes  
- Success pattern for "super like" swipes

### 2. Camera Access
Ready to integrate with `@capacitor/camera` for:
- Profile photo uploads
- Verification selfies
- In-app photo features

### 3. App Store Distribution
Once tested, you can:
- Submit to Apple App Store (iOS)
- Publish to Google Play Store (Android)

## Development Mode

The app is currently configured for **hot-reload mode**, which means:
- Changes made in Lovable appear instantly in the mobile app
- No need to rebuild for UI/code changes
- Perfect for rapid development

To disable hot-reload for production:
1. Open `capacitor.config.ts`
2. Remove or comment out the `server` section
3. Rebuild with `npm run build && npx cap sync`

## Troubleshooting

### Android Build Issues
- Ensure Android SDK is installed via Android Studio
- Check Java JDK is installed (v11 or higher)
- Run `npx cap sync android` to resolve dependency issues

### iOS Build Issues
- Ensure Xcode is updated to latest version
- Open project in Xcode: `npx cap open ios`
- Sign the app with your Apple Developer account

### Permission Issues
Add required permissions to platform-specific files:
- Android: `android/app/src/main/AndroidManifest.xml`
- iOS: `ios/App/App/Info.plist`

## App Icons & Splash Screens

Your app includes brand-colored assets in the `public/` folder:
- `app-icon.png` (1024x1024) - Master app icon
- `splash-screen.png` (1080x1920) - Splash screen

### Setting Up Icons

After adding platforms (`npx cap add ios/android`), copy assets to native folders:

**iOS** (in `ios/App/App/Assets.xcassets/`):
- Use Xcode to drag `app-icon.png` into AppIcon.appiconset
- Xcode will generate all required sizes

**Android** (in `android/app/src/main/res/`):
- Place `app-icon.png` in `mipmap-xxxhdpi/ic_launcher.png`
- Use Android Studio's Image Asset wizard for all sizes
- Place `splash-screen.png` in `drawable/splash.png`

Or use a tool like [capacitor-assets](https://github.com/ionic-team/capacitor-assets):
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

## Next Steps

After successful setup:
1. Test all features on physical devices
2. Configure proper signing certificates
3. Prepare for app store submission

## Useful Resources
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Deployment Guide](https://capacitorjs.com/docs/ios)
- [Android Deployment Guide](https://capacitorjs.com/docs/android)
