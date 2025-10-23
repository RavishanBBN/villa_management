# Mobile App Testing Guide

## 📱 How to Test the Halcyon Rest Mobile App

This guide will walk you through testing the React Native mobile app on different devices and platforms.

---

## Prerequisites

### 1. Ensure Backend is Running

The mobile app connects to your backend API. **First, start the backend server:**

```powershell
# Open a PowerShell terminal in the project root
cd c:\Users\USER\Desktop\villa-management-system\backend
npm start
```

✅ Backend should be running on: `http://localhost:3001`

---

## Option 1: Test on Android Emulator (Recommended for Windows)

### Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Install Android Studio
3. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

### Step 2: Set up Android SDK

1. Open Android Studio
2. Go to: **Tools → SDK Manager**
3. In **SDK Platforms** tab, install:
   - ✅ Android 13.0 (Tiramisu) - API Level 33
4. In **SDK Tools** tab, install:
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools

### Step 3: Create Android Virtual Device (AVD)

1. In Android Studio, go to: **Tools → Device Manager**
2. Click **Create Device**
3. Choose a device (recommended: **Pixel 5**)
4. Choose system image: **Android 13.0 (API 33)**
5. Click **Finish**

### Step 4: Set Environment Variables

Add these to your Windows environment variables:

```
ANDROID_HOME = C:\Users\USER\AppData\Local\Android\Sdk
```

Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

**To set environment variables:**
1. Press `Win + X` → System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Add/edit the variables above

### Step 5: Install Dependencies

```powershell
cd c:\Users\USER\Desktop\villa-management-system\mobile
npm install
```

### Step 6: Start Metro Bundler

```powershell
npm start
```

Keep this terminal open.

### Step 7: Run on Android Emulator

Open a **new PowerShell terminal**:

```powershell
cd c:\Users\USER\Desktop\villa-management-system\mobile

# Start the emulator (if not already running)
# You can also start it from Android Studio's Device Manager

# Run the app
npm run android
```

This will:
1. Build the Android app
2. Install it on the emulator
3. Launch the app automatically

### Expected Result:
- Emulator opens with your app running
- You see the Login screen
- Login with: **admin** / **admin123**
- Navigate through Reservations, Invoices, and Messages tabs

---

## Option 2: Test on Physical Android Device

### Step 1: Enable Developer Mode on Your Phone

1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. You'll see "You are now a developer!"

### Step 2: Enable USB Debugging

1. Go to **Settings → Developer Options**
2. Enable **USB Debugging**
3. Enable **Install via USB** (if available)

### Step 3: Connect Phone to Computer

1. Connect your Android phone via USB cable
2. On your phone, allow USB debugging when prompted
3. Select **File Transfer** mode

### Step 4: Verify Connection

```powershell
adb devices
```

You should see your device listed. If not:
- Install ADB drivers for your phone manufacturer
- Try a different USB cable
- Try different USB ports

### Step 5: Update API URL for Physical Device

Since your phone can't access `localhost`, you need to use your computer's local IP address.

**Find your local IP:**
```powershell
ipconfig
```

Look for **IPv4 Address** (e.g., `192.168.1.100`)

**Update the API URL:**

Edit `mobile\src\services\api.service.ts`:

```typescript
// Change from:
baseURL: 'http://10.0.2.2:3001/api',

// To (use YOUR IP address):
baseURL: 'http://192.168.1.100:3001/api',
```

**Important:** Make sure your phone and computer are on the **same Wi-Fi network**!

### Step 6: Run on Physical Device

```powershell
cd c:\Users\USER\Desktop\villa-management-system\mobile

# Start Metro bundler
npm start

# In another terminal, run:
npm run android
```

The app will install and launch on your phone!

---

## Option 3: Test on iOS (Requires macOS)

If you have a Mac, you can test on iOS:

### Step 1: Install Xcode
```bash
# Install from Mac App Store
```

### Step 2: Install CocoaPods
```bash
sudo gem install cocoapods
```

### Step 3: Install iOS Dependencies
```bash
cd mobile/ios
pod install
cd ..
```

### Step 4: Run on iOS Simulator
```bash
npm run ios
```

---

## Testing Checklist

Once the app is running, test these features:

### ✅ Authentication
- [ ] Login with `admin` / `admin123`
- [ ] See loading indicator during login
- [ ] Navigate to main tabs after successful login
- [ ] Logout and see login screen again

### ✅ Reservations Screen
- [ ] See list of all reservations
- [ ] Search for a guest name
- [ ] Filter by status (confirmed, checked_in, etc.)
- [ ] Pull down to refresh
- [ ] See color-coded status badges
- [ ] Tap a reservation (will show error for now - detail screen not implemented)

### ✅ Invoices Screen
- [ ] See list of invoices
- [ ] Search for an invoice
- [ ] Tap "Generate" button
- [ ] Select a reservation from the modal
- [ ] Generate a new invoice
- [ ] See success message
- [ ] See new invoice in the list

### ✅ Messages Screen
- [ ] See list of messages
- [ ] Filter by All/Unread/Read
- [ ] Tap "Compose" button
- [ ] Fill in recipient ID, subject, body
- [ ] Select priority and category
- [ ] Send a message
- [ ] See success confirmation

---

## Troubleshooting

### Problem: "Metro bundler won't start"
**Solution:**
```powershell
npx react-native start --reset-cache
```

### Problem: "Build failed"
**Solution:**
```powershell
cd android
.\gradlew clean
cd ..
npm run android
```

### Problem: "Cannot connect to backend" on Emulator
**Solution:**
- Ensure backend is running on port 3001
- Use `http://10.0.2.2:3001/api` for Android emulator
- Check `src/services/api.service.ts` has correct URL

### Problem: "Cannot connect to backend" on Physical Device
**Solution:**
- Ensure phone and computer are on same Wi-Fi
- Update API URL to your computer's local IP (not localhost)
- Check Windows Firewall isn't blocking port 3001
- Test backend access from phone browser: `http://YOUR_IP:3001/api/health`

### Problem: "App crashes on startup"
**Solution:**
```powershell
# Clear cache and rebuild
npx react-native start --reset-cache
cd android
.\gradlew clean
cd ..
npm run android
```

### Problem: "Red screen error in app"
**Solution:**
- Check the error message
- Most common: Backend not running → Start backend server
- API connection error → Check API URL in `api.service.ts`
- Check terminal logs for detailed errors

### Problem: "Gradle build fails"
**Solution:**
```powershell
cd android
.\gradlew clean
.\gradlew --stop
cd ..
npm run android
```

---

## Quick Start Commands

### Start Everything:

**Terminal 1 - Backend:**
```powershell
cd c:\Users\USER\Desktop\villa-management-system\backend
npm start
```

**Terminal 2 - Mobile Metro:**
```powershell
cd c:\Users\USER\Desktop\villa-management-system\mobile
npm start
```

**Terminal 3 - Run Android:**
```powershell
cd c:\Users\USER\Desktop\villa-management-system\mobile
npm run android
```

---

## Development Tips

### View Logs
```powershell
# Android logs
npx react-native log-android

# iOS logs
npx react-native log-ios
```

### Reload App
- **Android Emulator:** Press `R` twice or `Ctrl + M` → Reload
- **Physical Device:** Shake device → Reload

### Open Dev Menu
- **Android Emulator:** Press `Ctrl + M`
- **Physical Device:** Shake device

### Enable Hot Reload
- Open Dev Menu
- Enable "Fast Refresh"

---

## Network Configuration Summary

| Environment | API Base URL | Notes |
|-------------|-------------|-------|
| Android Emulator | `http://10.0.2.2:3001/api` | Maps to host's localhost |
| iOS Simulator | `http://localhost:3001/api` | Direct localhost access |
| Physical Device | `http://YOUR_IP:3001/api` | Replace with your local IP |

---

## Next Steps After Testing

Once basic testing is complete, you can:

1. **Add more screens:**
   - Reservation detail screen
   - Invoice detail screen
   - Message detail screen
   - User profile screen

2. **Enhance features:**
   - Push notifications
   - Offline mode with data sync
   - Image upload for messages
   - PDF viewer for invoices
   - Calendar view for reservations

3. **Build release version:**
   - Android APK: `cd android && .\gradlew assembleRelease`
   - iOS IPA: Archive in Xcode

4. **Deploy to stores:**
   - Google Play Store
   - Apple App Store

---

## Support

If you encounter issues not covered here:

1. Check React Native documentation: https://reactnative.dev/docs/getting-started
2. Check the app logs in the terminal
3. Look at the red error screen in the app (it shows the exact error)
4. Check backend logs for API errors

**Common First-Time Setup Issues:**
- ✅ Java JDK not installed → Install JDK 11+
- ✅ Android SDK not found → Set ANDROID_HOME environment variable
- ✅ Backend not running → Start backend first
- ✅ Wrong API URL → Update in api.service.ts

Happy testing! 🚀
