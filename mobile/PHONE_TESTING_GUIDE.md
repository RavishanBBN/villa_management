# Halcyon Rest Mobile - Physical Phone Testing Guide

## Prerequisites Checklist

Before testing on your phone, ensure you have:

- [ ] Java JDK 17 installed
- [ ] Android phone with USB debugging enabled
- [ ] USB cable to connect phone to computer
- [ ] Phone and computer on the same Wi-Fi network
- [ ] Backend running on http://10.96.5.87:3001

---

## Part 1: Install Java JDK 17

### Option 1: Manual Download (Recommended)
1. Download: https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.exe
2. Run the installer
3. Click Next → Next → Install
4. Approve the admin prompt when asked
5. Wait for installation to complete

### Option 2: Using Winget (with admin approval)
```powershell
winget install Microsoft.OpenJDK.17
# Click "Yes" when the User Account Control prompt appears
```

### Option 3: Using Chocolatey
```powershell
choco install openjdk17 -y
```

### Verify Installation
After installing, close and reopen PowerShell, then run:
```powershell
java -version
```

You should see something like:
```
openjdk version "17.0.16" 2024-07-16
```

If you see "java is not recognized", you need to:
1. Close ALL PowerShell/Command Prompt windows
2. Open a NEW PowerShell window
3. Try `java -version` again

---

## Part 2: Enable Developer Mode on Your Phone

### For Android:
1. Open **Settings**
2. Go to **About Phone** (or System → About)
3. Find **Build Number**
4. Tap **Build Number** 7 times rapidly
5. Enter your PIN/password if prompted
6. You'll see "You are now a developer!"

### Enable USB Debugging:
1. Go back to **Settings**
2. Find **Developer Options** (usually under System or at bottom of Settings)
3. Enable **USB Debugging**
4. Enable **Install via USB** (if available)
5. Enable **USB Debugging (Security Settings)** if available

---

## Part 3: Connect Your Phone

1. **Connect phone to computer** via USB cable
2. **On your phone**: Select **File Transfer** or **MTP** mode when prompted
3. **On your phone**: Allow USB debugging when the popup appears
   - Check "Always allow from this computer"
   - Tap "Allow" or "OK"

### Verify Connection:

```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile\android
.\gradlew.bat --version
```

If you see Gradle version info, you're good to go!

---

## Part 4: Start Backend Server

**Terminal 1** - Start Backend:
```powershell
cd C:\Users\USER\Desktop\villa-management-system\backend
npm start
```

Wait until you see:
```
🚀 Server is running on port 3001
✅ Database connected successfully
```

Leave this terminal running!

---

## Part 5: Run the Mobile App

**Terminal 2** - Start Metro Bundler:
```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile
npm start
```

Wait until you see:
```
Welcome to Metro!
```

Leave this terminal running!

**Terminal 3** - Install on Phone:
```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile
npm run android
```

### What Will Happen:
1. Gradle will build the app (takes 2-5 minutes first time)
2. App will be installed on your phone automatically
3. App will launch automatically
4. You'll see the login screen!

---

## Part 6: Login and Test

1. On your phone, the app should open automatically
2. You'll see the login screen
3. Login with:
   - **Username**: admin
   - **Password**: admin123

4. After login, you'll see three tabs:
   - 📅 **Reservations** - View all reservations
   - 📄 **Invoices** - View and generate invoices
   - ✉️ **Messages** - Send and receive messages

---

## Troubleshooting

### Issue: "java is not recognized"
**Solution**: 
- Close all PowerShell windows
- Open a NEW PowerShell window
- Try again

### Issue: "adb is not recognized"
**Solution**:
The gradlew script should handle this. If not:
1. Install Android Studio: https://developer.android.com/studio
2. Open Android Studio → More Actions → SDK Manager
3. Install Android SDK Platform-Tools

### Issue: Phone not detected
**Solution**:
1. Unplug and replug USB cable
2. On phone: Revoke USB debugging authorizations (Developer Options)
3. Reconnect and allow debugging again
4. Try a different USB cable
5. Try a different USB port on your computer

### Issue: "Cannot connect to server"
**Solution**:
1. Make sure backend is running: http://localhost:3001
2. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for IPv4 Address (should be 10.96.5.87)

3. Update IP in mobile app if needed:
   Edit: `mobile\src\services\api.service.ts`
   Line 8: Change to your computer's IP

4. Make sure phone and computer are on SAME Wi-Fi network
5. Test from phone browser: http://10.96.5.87:3001/api/health

### Issue: Build fails
**Solution**:
```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile\android
.\gradlew.bat clean
cd ..
npm run android
```

### Issue: Metro bundler error
**Solution**:
```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile
npx react-native start --reset-cache
```

---

## Quick Test Checklist

Once the app is running on your phone:

- [ ] Login with admin/admin123
- [ ] Navigate to Reservations tab
- [ ] Search for a reservation
- [ ] Filter by status
- [ ] Pull down to refresh
- [ ] Navigate to Invoices tab
- [ ] Tap "Generate" button
- [ ] Select a reservation
- [ ] Generate an invoice
- [ ] Navigate to Messages tab
- [ ] Tap "Compose"
- [ ] Fill in message details
- [ ] Send a message

---

## Development Commands

### Reload App (after code changes):
- **Android**: Shake phone → Tap "Reload"
- Or: Press `R` twice in Metro terminal

### View Logs:
```powershell
# In a new terminal
cd C:\Users\USER\Desktop\villa-management-system\mobile
npx react-native log-android
```

### Clear Cache:
```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile
npx react-native start --reset-cache
```

### Rebuild App:
```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile\android
.\gradlew.bat clean
cd ..
npm run android
```

---

## Network Configuration

Your app is configured to connect to:
```
Backend API: http://10.96.5.87:3001/api
```

If you need to change this:
1. Edit: `mobile\src\services\api.service.ts`
2. Line 8: Update `API_BASE_URL`
3. Rebuild the app

---

## Success Indicators

✅ Java installed: `java -version` works  
✅ Phone connected: USB debugging allowed  
✅ Backend running: http://localhost:3001  
✅ Metro running: "Welcome to Metro!" message  
✅ App installed: Build succeeds, app opens  
✅ Connected to backend: Login works  

---

## Need Help?

If you're stuck:
1. Check all three terminals are running (backend, metro, build)
2. Check phone is connected (USB debugging authorized)
3. Check phone and computer on same Wi-Fi
4. Try rebooting phone and computer
5. Try a different USB cable/port

---

## Alternative: Build APK for Manual Installation

If USB connection doesn't work, you can build an APK:

```powershell
cd C:\Users\USER\Desktop\villa-management-system\mobile\android
.\gradlew.bat assembleRelease
```

APK will be at:
```
android\app\build\outputs\apk\release\app-release.apk
```

Transfer to phone and install manually!

---

**Good luck! 🚀📱**
