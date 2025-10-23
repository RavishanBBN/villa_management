# 📱 Final Steps to Run Mobile App

## ✅ What's Already Done:
- Java JDK 17 installed
- Android project configured
- Gradle updated to compatible version
- All TypeScript code complete
- Backend connected to http://10.96.5.87:3001/api

## 🎯 Next Steps:

### Step 1: Connect Your Android Phone

1. **Enable Developer Mode:**
   - Settings → About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Settings → Developer Options
   - Turn on "USB Debugging"
   - Turn on "Install via USB" (if available)

3. **Connect Phone:**
   - Plug in USB cable
   - On phone: Allow USB debugging
   - Select "File Transfer" mode

### Step 2: Run the Setup Script

Open a **NEW PowerShell window** and run:

```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile
.\setup-android-env.ps1
```

This sets up all environment variables.

### Step 3: Start Backend (Terminal 1)

```powershell
cd C:\Users\USER\Desktop\villa-management-system\backend
npm start
```

Leave this running!

### Step 4: Run Mobile App (Terminal 2 - After setup script)

```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile
npm run android
```

**First time will take 5-10 minutes** to:
- Download Gradle (if needed)
- Download dependencies
- Build the app
- Install on your phone

### What You'll See:

1. Terminal shows "Downloading https://services.gradle.org/distributions/gradle-8.0.1-all.zip"
   - **Wait for this to complete** (may take a few minutes)

2. Then it will build: "BUILD SUCCESSFUL"

3. App installs on your phone automatically

4. App launches showing the login screen

5. Login with:
   - **Username:** admin
   - **Password:** admin123

## 🔧 If Phone Not Detected:

The build will work but need to manually check connection:

### After Gradle downloads, verify phone connection:

```powershell
# Set environment (if not done via script)
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

# Check if phone is connected
adb devices
```

You should see your device listed. If not:
- Unplug and replug USB cable
- On phone: Revoke USB debugging authorizations (in Developer Options)
- Reconnect and allow debugging again

## 📊 Build Status:

✅ Gradle downloading (in progress)
✅ Project configured correctly
✅ Java installed
⏳ Waiting for first build to complete
⏳ Phone connection pending

## 🚀 Once Built:

The app will have:
- 📅 **Reservations Tab** - View all reservations, search, filter by status
- 📄 **Invoices Tab** - View invoices, generate new ones for reservations
- ✉️ **Messages Tab** - Send and receive staff messages
- 🔐 **JWT Authentication** - Secure login with token refresh
- 🔄 **Pull to Refresh** - On all screens
- 🌙 **Dark Theme** - Matching your web app

## ⚡ Pro Tips:

1. **First build is slow** - Subsequent builds are much faster
2. **Keep terminals open** - Backend and Metro bundler need to stay running
3. **Hot reload works** - After initial install, changes appear instantly
4. **Shake phone** - Opens dev menu for reload/debug options

## 🆘 Troubleshooting:

**Build stuck?**
- Just wait, Gradle download can take 5-10 minutes on slow connections

**"adb not recognized"?**
- You need Android SDK Platform Tools
- Download: https://developer.android.com/studio/releases/platform-tools
- Extract to: C:\Users\USER\AppData\Local\Android\Sdk\platform-tools

**Phone not detected after build?**
- Install just Platform Tools (lightweight, no need for full Android Studio)
- Or manually install APK after build completes

## 📍 Current Status:

Your terminal is currently downloading Gradle 8.0.1. This is normal and happens once.

**Let it complete**, then the build will start automatically!

---

**Next:** Once you see "BUILD SUCCESSFUL", the app will install on your phone! 🎉
