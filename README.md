# Blind Box Platform (working name)

One Angular 18 codebase → **website**, **PWA** and **native iOS / Android apps** (Capacitor).

## Run the website

```bash
npm install
npm start                 # http://localhost:4200
# Back office: http://localhost:4200/#/admin  (demo login admin / admin123)
npm run build             # production build → dist/mengbox/browser (deploy this folder)
```

- Phones / tablets (< 1024px) use the **phone navigation**; screens ≥ 1024px use the **desktop navigation**.
  Both are set in the back office → Navigation.
- The production build includes a service worker and `manifest.webmanifest`, so on phones users can
  "Add to Home Screen" and get a full-screen app (PWA).

## Build the native apps

Requirements: Android Studio (Android), a Mac with Xcode + CocoaPods (iOS).

```bash
npm run build
npx cap sync              # copies the web build into android/ and ios/
npx cap open android      # Android Studio → Run, or Build > Generate Signed Bundle (AAB) for Google Play
npx cap open ios          # Xcode → choose a team → Run, or Product > Archive for the App Store
```

After every web change: `npm run build && npx cap sync`.

Before the first store release, set the final values in `capacitor.config.ts`:

- `appId` (e.g. `com.yourcompany.yourapp`) — **cannot change after release**
- `appName`

Then run `npx cap sync`. App icons / splash come from `assets/` — replace `assets/icon-only.png`,
`assets/icon-foreground.png`, `assets/icon-background.png` and `assets/splash*.png`, then run
`npx @capacitor/assets generate`.

## Going live with a real API

`src/environments/environment*.ts`: set `apiUrl` to your server and `useMockBackend: false`.
The back office calls `GET /api/site-config`, `PUT /api/site-config`, `POST /api/site-config/reset`, `POST /api/admin/login`.
