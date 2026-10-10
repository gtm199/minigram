# MiniGram mobile (Expo + React Native + TypeScript)

## Setup (Windows PowerShell), from `minigram\mobile`

This folder holds the app source only. Install dependencies so Expo picks versions
that match the current SDK:

```powershell
npm install expo@latest
npx expo install react react-dom react-native expo-router expo-secure-store expo-image-picker expo-status-bar expo-linking expo-constants react-native-safe-area-context react-native-screens @expo/vector-icons
npm install axios react-hook-form yup @hookform/resolvers
npm install -D typescript @types/react
npx expo install --fix

Copy-Item .env.example .env
```

### If `npm install` fails with `ERESOLVE` (react / react-dom conflict)

npm tried to pull a `react-dom` newer than the React version your Expo SDK pins. Install the matching one
first, then retry:

```powershell
npx expo install react-dom
npm install axios react-hook-form yup @hookform/resolvers
```

Last resort (accepts npm's peer-dependency mismatch; Expo itself works fine with it):

```powershell
npm install axios react-hook-form yup @hookform/resolvers --legacy-peer-deps
```

## Point the app at your backend

Edit `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

`localhost` on a physical phone means the phone itself, not your PC. Use your PC's LAN IPv4
address (`ipconfig`), keep the phone on the same Wi-Fi, run Django with
`python manage.py runserver 0.0.0.0:8000`, and allow Python through Windows Firewall
(private networks). For the Android emulator use `http://10.0.2.2:8000/api`.
Restart Expo with `npx expo start -c` after changing `.env`.

## Run

```powershell
npx expo start          # scan the QR code with Expo Go
npx expo start --android
npm run typecheck
```

## Backend

Start the Django server (`python manage.py runserver 0.0.0.0:8000` in `backend`) before opening the app.
Every endpoint the app calls is documented in `API_CONTRACT.md` and implemented in `backend/apps`.
