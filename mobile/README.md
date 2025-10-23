# Halcyon Rest Mobile App

React Native mobile application for Halcyon Rest Villa Management System staff.

## Features

- **Authentication**: Secure JWT-based login for staff members
- **Reservations Management**: View all property reservations with search and filtering
- **Invoice Generation**: Generate and view invoices for reservations
- **Messaging System**: Internal communication between staff members

## Tech Stack

- **Framework**: React Native CLI 0.73.1 (NOT Expo)
- **Language**: TypeScript 5.0.4
- **State Management**: Redux Toolkit 2.0.1
- **Navigation**: React Navigation 6.x
- **HTTP Client**: Axios 1.6.2 with JWT interceptors
- **Storage**: AsyncStorage for token persistence

## Prerequisites

Before you begin, ensure you have the following installed:

### For Both Platforms
- Node.js 18+ and npm/yarn
- React Native CLI: `npm install -g react-native-cli`
- Git

### For Android Development
- Java Development Kit (JDK 11 or newer)
- Android Studio with Android SDK
- Android SDK Platform 33
- Android SDK Build-Tools
- Android Emulator or physical device

### For iOS Development (macOS only)
- Xcode 14 or newer
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator or physical device

## Installation

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **For iOS** (macOS only):
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Configuration

### API Endpoint

The app is configured to connect to the backend API. Update the base URL in `src/services/api.service.ts` if needed:

- **Android Emulator**: `http://10.0.2.2:3001/api` (default - maps to host machine localhost)
- **iOS Simulator**: `http://localhost:3001/api`
- **Physical Device**: `http://YOUR_LOCAL_IP:3001/api` (replace with your machine's local IP)

### Backend Setup

Ensure the backend server is running on `http://localhost:3001`:

```bash
# From project root
cd backend
npm start
```

## Running the App

### Android

1. **Start Metro bundler**:
   ```bash
   npm start
   ```

2. **In a new terminal, run Android**:
   ```bash
   npm run android
   ```

   Or with React Native CLI:
   ```bash
   npx react-native run-android
   ```

### iOS (macOS only)

1. **Start Metro bundler**:
   ```bash
   npm start
   ```

2. **In a new terminal, run iOS**:
   ```bash
   npm run ios
   ```

   Or with React Native CLI:
   ```bash
   npx react-native run-ios
   ```

## Default Login Credentials

For testing purposes, use these credentials:

- **Username**: `admin`
- **Password**: `admin123`

## Project Structure

```
mobile/
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx      # Navigation configuration
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Authentication screen
│   │   ├── ReservationsScreen.tsx # View all reservations
│   │   ├── InvoicesScreen.tsx    # View and generate invoices
│   │   └── MessagesScreen.tsx    # Staff messaging
│   ├── services/
│   │   ├── api.service.ts        # HTTP client with JWT interceptors
│   │   ├── auth.service.ts       # Authentication operations
│   │   ├── reservation.service.ts # Reservation CRUD
│   │   ├── invoice.service.ts    # Invoice operations
│   │   └── message.service.ts    # Messaging operations
│   ├── store/
│   │   ├── index.ts              # Redux store configuration
│   │   ├── hooks.ts              # Typed Redux hooks
│   │   └── slices/
│   │       ├── authSlice.ts      # Auth state management
│   │       ├── reservationsSlice.ts
│   │       ├── invoicesSlice.ts
│   │       └── messagesSlice.ts
│   └── types/
│       ├── auth.types.ts         # TypeScript interfaces
│       ├── reservation.types.ts
│       ├── invoice.types.ts
│       └── message.types.ts
├── App.tsx                        # Root component
├── index.js                       # App entry point
├── package.json
└── tsconfig.json
```

## Key Features Detail

### Reservations Screen
- View all property reservations
- Search by guest name or property
- Filter by status (confirmed, checked_in, checked_out, cancelled)
- Pull-to-refresh functionality
- Color-coded status badges

### Invoices Screen
- View all generated invoices
- Search by invoice number or guest name
- Generate new invoices for reservations
- Color-coded payment status (paid, partially_paid, unpaid, overdue)
- Pull-to-refresh functionality

### Messages Screen
- View all staff messages
- Filter by read/unread status
- Send new messages to other staff
- Priority and category indicators
- Mark messages as read automatically

## Troubleshooting

### Android

**Metro bundler won't start:**
```bash
npx react-native start --reset-cache
```

**Build fails:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Cannot connect to backend:**
- Ensure backend is running on port 3001
- For emulator, use `http://10.0.2.2:3001/api`
- For physical device, use your local IP address

### iOS

**Pod install fails:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Build fails in Xcode:**
- Clean build folder: Product → Clean Build Folder
- Ensure Xcode Command Line Tools are installed
- Check iOS Deployment Target matches (iOS 13.0+)

**Cannot connect to backend:**
- Ensure backend is running on port 3001
- For simulator, use `http://localhost:3001/api`
- For physical device, use your local IP address and ensure both devices are on same network

## Development

### Running in Debug Mode

The app runs in debug mode by default. To see logs:

**Android:**
```bash
npx react-native log-android
```

**iOS:**
```bash
npx react-native log-ios
```

### Building for Release

**Android APK:**
```bash
cd android
./gradlew assembleRelease
# APK location: android/app/build/outputs/apk/release/app-release.apk
```

**iOS (requires Apple Developer Account):**
```bash
# Open in Xcode
open ios/HalcyonRestMobile.xcworkspace
# Product → Archive
```

## API Endpoints Used

- `POST /api/auth/login` - Staff authentication
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/reservations` - List all reservations
- `GET /api/reservations/:id` - Get reservation details
- `PATCH /api/reservations/:id/status` - Update reservation status
- `GET /api/invoices` - List all invoices
- `POST /api/invoices/generate/reservation/:id` - Generate invoice
- `GET /api/messages` - List all messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark message as read

## Support

For issues or questions, please contact the development team.

## License

Proprietary - Halcyon Rest Villa Management System
