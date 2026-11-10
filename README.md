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

## API

Every game has its own API. Pages never decide outcomes or touch coins themselves — they call the API
and only animate the answer. Today the API is answered by an **in-browser mock server**
(`src/app/mock-server/`, data in `localStorage`), so the demo runs with no backend.

| Area | Endpoints |
| --- | --- |
| Back office | `GET/PUT /api/site-config`, `GET /api/site-config/default`, `POST /api/site-config/reset`, `POST /api/admin/login` |
| Account | `GET /api/account`, `POST /api/account/{top-up, sell, promo, check-in, missions/claim, free-box}` |
| Mystery boxes | `POST /api/games/boxes/{open, demo}` |
| Ichiban Kuji | `GET /api/games/kuji/state`, `POST /api/games/kuji/{select, pull, tick}` |
| Gacha | `GET /api/games/gacha/state`, `POST /api/games/gacha/spin` |
| Blind box case | `GET /api/games/blind-box/state`, `POST /api/games/blind-box/{select, hint, xray, shake, buy, new-case, tick}` |
| Claw machine | `GET /api/games/claw/state`, `POST /api/games/claw/{start, grab, finish}` |
| Group pull | `GET /api/games/group-pull/lobby`, `POST /api/games/group-pull/join` |
| Box battles | `GET /api/games/battles/lobby`, `POST /api/games/battles/{join, watch, create}` |
| Market | `GET /api/games/market/state`, `POST /api/games/market/{buy, list, unlist, tick}` |
| Swap board | `GET /api/games/swap/state`, `POST /api/games/swap/{create-post, make-offer, accept-offer, decline-offer, unlist, block, rules-read, refresh, tick}` |
| Lucky wheel | `GET /api/games/wheel/state`, `POST /api/games/wheel/spin` |

- **Switching a game off** in the back office hides it in the app *and* makes its API answer
  `403 { code: "gameDisabled" }`.
- Account and game endpoints answer `{ data, account, paid? }` — `account` is the player's wallet,
  inventory and daily progress after the action (types in `src/app/models/api/api.model.ts`).
- Errors answer `{ code }` with 400 / 402 (`noCoins`) / 403 / 404.
- Prices, odds and reward tables shared by both sides live in `src/app/utils/game-rules.util.ts`.

### Going live with a real API

Build a server that implements the endpoints above (the mock server in `src/app/mock-server/` is a
working reference), then in `src/environments/environment*.ts` set `apiUrl` to it and `useMockBackend: false`.
