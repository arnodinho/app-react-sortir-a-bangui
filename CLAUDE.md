# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo contains **two parallel implementations** of the same React Native mobile app (a
WordPress-backed listing/booking app, based on the "Listar" PassionUI template, customized as
"Sortir à Bangui"):

- `source/` — the **active** implementation: plain React Native CLI (RN 0.65, React 17). This is
  the only one tracked by its own git repo (`git log` inside `source/` shows real commits:
  "update domain", "update contact form", etc.) and the only one with meaningful customization —
  treat it as the project unless told otherwise.
- `source-expo/` — an Expo (SDK 42) variant of the same app. It is a largely untouched vendor copy
  (no `.git`), kept for reference/parity. Do not assume changes made in `source/` are mirrored here
  unless explicitly asked to port them.
- `docs/` — a static HTML copy of the vendor's documentation page (`docs/index.html`), not
  something to edit.

`source/` and `source-expo/app/` have near-identical internal structure (same folder names,
same `@alias` names), so architecture notes below apply to both unless noted.

All commands below assume `cd source` first (or `cd source-expo` for the Expo variant).

## Commands (source/ — React Native CLI)

```bash
npm install                # install deps
npm run android             # run on Android (device/emulator must be running)
npm run ios                 # run on iOS (device/simulator must be running)
npm start                   # start Metro bundler only
npm test                    # run Jest (note: no test files currently exist in the repo)
npm run lint                # eslint . (config: @react-native-community)
npm run setup                # nukes watchman/node_modules/Pods and reinstalls everything (use when deps are broken)
```

To run a single Jest test file/pattern: `npx jest path/to/file.test.js` (or `-t "test name"`).

Producing the JS bundle manually (e.g. for release builds without a running Metro server):
```bash
react-native bundle --platform android --dev false --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

## Commands (source-expo/)

```bash
npm install
npm start      # expo start
npm run android / npm run ios / npm run web
npm run eject
```

## Architecture (app/ inside either source tree)

### Module aliasing via Haste, not a bundler plugin
Every top-level folder under `app/` (`config`, `store`, `actions`, `reducers`, `sagas`,
`selectors`, `models`, `services`, `api`, `components`, `screens`, `utils`) contains a minimal
`package.json` with only a `"name": "@foldername"` field (e.g. `app/store/package.json` →
`{"name": "@store"}`). Metro's Haste module resolution picks these up automatically, so code
imports them as bare specifiers: `import {store} from '@store'`, `import {Icon} from '@components'`,
`import Home from '@screens/Home'`. **There is no babel module-resolver config** — if an alias
seems unresolved, check for a stray/missing `package.json` in that folder rather than looking in
`babel.config.js`.

### Data flow: Redux + redux-saga + redux-persist
- `app/store` creates the store, wires `redux-saga` middleware, and wraps the root reducer with
  `redux-persist` (AsyncStorage-backed; `home`, `wishlist`, `list` are blacklisted from
  persistence since they're fetched fresh).
- `app/reducers/index.js` combines one reducer per domain: `auth`, `application`, `config`,
  `wishlist`, `home`, `list`, `search`.
- `app/sagas/index.js` forks one root saga per domain: `auth`, `config`, `home`, `wishlist`,
  `product`, `list`, `search`. Sagas are where API calls happen; screens dispatch actions
  (`app/actions`) and read state via selectors (`app/selectors`), never calling `app/api` directly.
- `app/api/index.js` defines REST endpoints and thin wrapper functions; `app/services/network.js`
  is the single axios instance (interceptors attach JWT bearer token, device headers, and
  `Accept-Language` from `i18next`, all read from the Redux store at request time via
  `store.getState()`).

### Backend contract
The app talks to a **WordPress** backend exposing the Listar plugin's REST API plus
`wp-json/jwt-auth` for auth. Endpoints are listed in `app/api/index.js` (`index.php/wp-json/...`).
The backend base URL and device info live in Redux `config` state (`getUrl()`/`getDevice()` in
`network.js`), not in a static config file — changing the API host means dispatching a config
action, not editing `app/config`.

### App-level config (`app/config`)
`app/config/setting.js` holds `BaseSetting`: app name/version, backend `domain`/`protocol`
(currently `sab.yanga-consulting.com`), `defaultLanguage` (`fr`), and the full i18next
`resourcesLanguage` map pulled from `app/lang/*.json`. `app/config/theme.js` / `typography.js` /
`styles.js` provide the light/dark theme and font-size system consumed via the `useTheme()` /
`useFont()` hooks exported from `@config`.

### Navigation
`app/navigation/index.js` is the root stack (`@react-navigation/stack`): auth screens
(`SignIn`/`SignUp`/`ResetPassword`), modal-style screens (`Alert`, `Filter`, `PickerScreen`,
image preview, theme/font pickers — all rendered as `transparentModal` with fade interpolators),
and `Main`. It also owns i18next initialization/language switching and status bar theming, driven
by the `auth`/`config` Redux state.

`app/navigation/main.js` is the authenticated app: a bottom tab navigator (`Home`, `Wishlist`,
`Profile`) wrapped in a stack that adds the secondary screens (`Category`, `List`, `ProductDetail`,
`Review`, `Setting`, profile editing, etc.). It also registers Firebase Cloud Messaging handlers
(`@react-native-firebase/messaging`) that navigate to `ProductDetail` on notification tap, using
`NotificationModel` from `@models` to parse the payload.

### Models
`app/models` wraps raw API responses in classes (e.g. `NotificationModel`) rather than passing
plain objects/DTOs around — check for an existing model before adding new remote-data handling.

### Localization
Translations are static JSON files per language in `app/lang/*.json`, loaded eagerly into
`BaseSetting.resourcesLanguage` — adding a language means adding both the JSON file and an entry
in `app/config/setting.js` (`languageSupport` + `resourcesLanguage`).

## Native projects

`source/android` and `source/ios` are real native RN projects (also `source/ios.zip`, a large
stale archive — don't treat it as source of truth over `source/ios`). Native changes (app icons,
permissions, Firebase config, signing) must be made in these folders directly; they are not
generated from JS-level config.
