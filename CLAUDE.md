# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo contains **two parallel implementations** of the same React Native mobile app (a
WordPress-backed listing/booking app, based on the "Listar" PassionUI template, customized as
"Sortir à Bangui"):

- `source/` — the **active** implementation: plain React Native CLI, now on **RN 0.88 / React 19**
  with the New Architecture (Fabric/TurboModules; the Old Architecture is gone). This was
  re-platformed from RN 0.65.1/React 17 on branch `chantier/rn-0.88-upgrade` — see "RN 0.88
  migration notes" below for what changed and why. It's the only implementation with meaningful
  customization — treat it as the project unless told otherwise.
- `source-expo/` — an Expo (SDK 42) variant of the same app. It is a largely untouched vendor copy
  (no `.git`), kept for reference/parity. Do not assume changes made in `source/` are mirrored here
  unless explicitly asked to port them.
- `docs/` — a static HTML copy of the vendor's documentation page (`docs/index.html`), not
  something to edit.

`source/` and `source-expo/app/` have near-identical internal structure (same folder names,
same `@alias` names), so architecture notes below apply to both unless noted.

All commands below assume `cd source` first (or `cd source-expo` for the Expo variant).

## Commands (source/ — React Native CLI)

Requires Node ≥22.11 (`.nvmrc` pins `24.22.3`; `nvm use` before anything else) and, for Android
builds, JDK 17 (`JAVA_HOME` must point at a Temurin/AdoptOpenJDK 17 install — Gradle 9 rejects
older JDKs).

```bash
npm ci --legacy-peer-deps   # install deps — see note below on why --legacy-peer-deps is required
npm run android             # run on Android (device/emulator must be running)
npm run ios                 # run on iOS (device/simulator must be running)
npm start                   # start Metro bundler only
npm test                    # run Jest (note: no test files currently exist in the repo)
npm run lint                # eslint .
```

`--legacy-peer-deps` works around a reproducible npm/arborist crash (`TypeError: Cannot read
properties of null (reading 'children')`) hit on a clean install of this dependency tree with
npm ≥11; it is not optional. `postinstall` runs `patch-package`, which reapplies two patches
from `patches/` (`react-native-maps`, `react-native-pager-view`) that are lost on every fresh
`npm install`/`ci` — if you change either package's version, regenerate the patch with
`npx patch-package <pkg> --exclude "android/build"` (the exclude matters: without it the patch
picks up stray compiled Gradle build artifacts).

iOS also needs CocoaPods via the pinned Bundler setup: `bundle install` once, then
`bundle exec pod install` from `ios/` (or let `npm run ios` do it).

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

### Module aliasing via bare specifiers (`@config`, `@store`, etc.)
Every top-level folder under `app/` (`config`, `store`, `actions`, `reducers`, `sagas`,
`selectors`, `models`, `services`, `api`, `components`, `screens`, `utils`) is imported as a bare
specifier: `import {store} from '@store'`, `import {Icon} from '@components'`,
`import Home from '@screens/Home'`.

In `source-expo/` (still RN/Metro-with-Haste-era) this works via a minimal per-folder
`package.json` (`{"name": "@foldername"}`) picked up by Metro's old Haste module map. **In
`source/` (RN 0.88) Haste-style resolution no longer works** — those per-folder `package.json`
files are vestigial. The alias resolution now happens explicitly in `source/metro.config.js` via
a custom `resolver.resolveRequest` that maps each `@alias` (and `@alias/subpath`) to
`app/<folder>`. If an alias seems unresolved in `source/`, check that function (and that the
alias list there matches the folder list under `app/`), not a stray/missing `package.json` and
not `babel.config.js` (there is still no babel module-resolver plugin).

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

## RN 0.88 migration notes (source/ only)

`source/` was re-platformed from RN 0.65.1/React 17 to RN 0.88/React 19 + New Architecture
(scaffold-and-port, not an incremental upgrade — the version gap was too wide for that). A few
things that fell out of that migration and aren't obvious from reading the code in isolation:

- **Library replacements** (all abandoned since ~2020-2022, had no New Architecture path):
  `react-native-snap-carousel` → `react-native-reanimated-carousel` (`app/screens/List/index.js`);
  `rn-range-slider` → `@react-native-assets/slider` (`app/components/RangeSlider/*`,
  `app/screens/Filter/index.js`); `react-native-swiper` → `react-native-pager-view` (no built-in
  dot indicator, hence the new `app/components/PaginationDots`) in `app/screens/Home/index.js`,
  `app/screens/Walkthrough/index.js`, `app/screens/PreviewImage/index.js`.
- **Firebase**: ported from the namespaced to the modular `@react-native-firebase` API. Only
  three files touch it: `app/sagas/auth.js`, `app/screens/Profile/index.js`,
  `app/navigation/main.js`.
- **Splash screen**: `org.devio.rn.splashscreen`/custom iOS launch screen → `react-native-bootsplash`
  (source image in `assets/bootsplash/`, regenerate via its CLI if the logo changes).
- **React 19 dropped `Component.defaultProps` on function components** — every UI component in
  `app/components` that used `Function.defaultProps = {...}` now also does
  `props = {...Component.defaultProps, ...props}` as the first line of the function body. If you
  add a new component with default props, use plain default parameters instead
  (`function Foo({bar = 'x'} = {})`) rather than reviving the `.defaultProps` pattern.
- **Android vector-icon fonts**: `android/app/build.gradle` applies
  `react-native-vector-icons/fonts.gradle`, which copies the vector-icon `.ttf`s into the build at
  compile time. Do **not** also list those same fonts as static files under
  `android/app/src/main/assets/fonts/` — only the 38 custom fonts (Roboto/Merriweather/Raleway)
  belong there; duplicating a vector-icon font in both places fails `:app:mergeDebugAssets` with
  "Duplicate resources". iOS fonts are registered differently: `UIAppFonts` in `Info.plist` lists
  all font filenames (custom + vector-icon) as plain filenames, and `react-native.config.js`'s
  `assets` array plus the `react-native-asset` CLI (not CocoaPods resource bundling, which lands
  fonts inside the pod's own `.framework` and breaks lookup) is what actually copies them into the
  iOS bundle.
- **iOS native shell**: new Swift `AppDelegate`/scene-based `SceneDelegate` template (no more
  Objective-C `AppDelegate.m`). `AppDelegate` keeps an explicit `var window: UIWindow?` purely so
  `RNFBMessaging` (written for the pre-SceneDelegate lifecycle) doesn't crash reaching for it —
  the real window lives on `SceneDelegate`. `ios/Podfile` uses
  `use_frameworks! :linkage => :dynamic` (required for `@react-native-firebase`'s SPM-resolved
  Firebase); `react-native-maps`' Google Maps subspec only ships a static xcframework, which
  CocoaPods forbids a dynamic pod from depending on — fixed via the `patches/` podspec patch
  (`s.static_framework = true`), not a Podfile hook (CocoaPods validates static/dynamic linkage
  before `post_install` runs).
- **Signing continuity**: the same Play Store signing key (`android/sab-keystore`) and the same
  Firebase configs (`google-services.json`, `GoogleService-Info.plist`) carried over unchanged —
  this is still the same shipped app (`com.ayanga.sortirabangui`), not a new one.
- `npm run setup` (the old nuke-and-reinstall script) doesn't exist anymore — use
  `npm ci --legacy-peer-deps` (see Commands above) for a clean reinstall instead.

## Native projects

`source/android` and `source/ios` are real native RN projects (also `source/ios.zip`, a large
stale archive — don't treat it as source of truth over `source/ios`). Native changes (app icons,
permissions, Firebase config, signing) must be made in these folders directly; they are not
generated from JS-level config.
