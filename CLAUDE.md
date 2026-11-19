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
- `wordpress/` — server-side code for the WordPress backend that the app depends on but that is
  **not** part of the Listar plugin (e.g. `mu-plugins/sab-contact.php`, the `sab/v1/contact`
  endpoint behind the "Nous contacter" screen, which e-mails messages via `wp_mail`;
  `mu-plugins/sab-account-deletion.php`, the Google Play account-deletion requirement: public page
  `/supprimer-mon-compte/` + `sab/v1/account/delete` used by Profile → "Supprimer mon compte").
  `mu-plugins/sab-password-policy.php` enforces the password rule (≥ 8 chars, one uppercase, one
  digit) server-side on `listar/v1/auth/register`, `wp/v2/users/me` and the WordPress reset/profile
  forms; the app mirrors it in `app/utils/password.js` (+ live checklist `components/PasswordRules`).
  Keep both in sync. `mu-plugins/sab-events.php` is the Agenda: custom post type `sab_event`
  (independent of Listar places, menu "Agenda" in wp-admin) + `sab/v1/events` (list with
  `scope=upcoming|past`, detail `/events/{id}`, authenticated POST creates one, **published immediately** — no moderation by design, admin is
  e-mailed; max 5/user/24h).
  Dates are stored as site-local wall-clock `Y-m-d H:i:s`; the app parses them as wall-clock too
  (`models/event.js`), never through UTC. `mu-plugins/sab-popular.php` adds `data.popular` to
  `listar/v1/home/init` (via `rest_post_dispatch`, Listar untouched): top 5 places by interactions
  = approved comments (`posts.comment_count`) + favorites (usermeta `_like_post`), topped up with
  the most recent places. Views aren't tracked by Listar. The `rating_count` post meta is NOT a
  reliable comment count (stale on some places, e.g. 8 with no comment left). Kadence Security's own password requirements (strength, HIBP) are limited to
  the Administrators + Editors user groups (app users are `author`). Gotcha: for these requirements
  Kadence ignores the "enabled" checkbox — a requirement is active as soon as its user-group list
  is non-empty. When Kadence does force a change, the token endpoint returns its HTML wp-login.php
  interstitial (HTTP 200) instead of JSON — SignIn detects it and points to ResetPassword.
  Deleting an account keeps all its places (any status) and their photos, reassigned to the admin
  `SAB_DELETION_REASSIGN_LOGIN` (`joel`); only the profile, avatar and favorites are deleted. Note
  `wp_delete_user()` does NOT delete `listar` posts (the post type doesn't support `author`).
  **Client IP:** the site sits behind a reverse proxy; the server is configured so WordPress sees
  the visitor's real IP. If logins suddenly get locked for *everyone*, the security plugins are
  probably seeing the proxy's IP again — check the server's proxy/IP setup first. (Server and ops
  details are intentionally kept out of this public repository.)
  These plugins live in the separate WordPress project (local copy next to this repo, synced to
  the server). Nothing here is deployed automatically: files must be copied to the server's
  `wp-content/mu-plugins/` by hand.

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
npm ≥11; it is not optional. `postinstall` runs `patch-package`, which reapplies the patches
from `patches/` (`react-native-maps`, `react-native-pager-view`, `react-native-image-picker`)
that are lost on every fresh
`npm install`/`ci` — if you change one of those packages' version, regenerate the patch with
`npx patch-package <pkg> --exclude "android/build"` (the exclude matters: without it the patch
picks up stray compiled Gradle build artifacts).

iOS also needs CocoaPods via the pinned Bundler setup: `bundle install` once, then
`bundle exec pod install` from `ios/` (or let `npm run ios` do it).

To run a single Jest test file/pattern: `npx jest path/to/file.test.js` (or `-t "test name"`).

Release App Bundle for the Play Store (JDK 17, from `android/`): `./gradlew bundleRelease` →
`app/build/outputs/bundle/release/app-release.aab`, signed with `sab-keystore`. **Gotcha:** Gradle can
wrongly mark `:app:createBundleReleaseJsAndAssets` as UP-TO-DATE after JS/translation-only changes and
ship a stale JS bundle — run `./gradlew :app:createBundleReleaseJsAndAssets --rerun` first. Bump
`versionCode` in `android/app/build.gradle` for every upload.

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

### Alerts: `Alert.alert` is globally overridden
`app/screens/Loading/index.js` reassigns `Alert.alert` (from `react-native`) at startup to
navigate to the app's own `Alert` screen (`app/screens/Alert`). The override takes a **single
object** — `Alert.alert({title, message, type: 'success'|'warning', action: [{text, onPress}],
option})` — and renders at most two buttons (default label `t('close')`). The positional RN
signature `Alert.alert(title, message, buttons)` does **not** work anywhere in the app (it
renders an empty dialog with a "Fermer" button). For more than two choices use
`ActionSheetIOS` on iOS (see `ProfileEdit`'s avatar chooser).

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
  before `post_install` runs). Same root cause for `react-native-image-picker`: its podspec omits
  `MobileCoreServices`/`UniformTypeIdentifiers` from `s.frameworks`, which only breaks under dynamic
  framework linkage (undefined `_UTType*` symbols) — fixed by the `patches/` podspec patch.
- **Profile photo upload** (`ProfileEdit` → `ON_UPLOAD_AVATAR` saga): two calls — multipart upload
  to `wp/v2/media`, then `POST wp/v2/users/me` with `listar_user_photo=<attachment id>` sent
  **form-encoded**. The Listar plugin reads that field from `$_POST`; it is not a registered REST
  field, so a JSON body is accepted with HTTP 200 but silently ignored.
- **Place creation** (Home "+" button → `AddPlace` → `CREATE_PLACE` saga in `sagas/product.js`):
  the backend contract is quirky and undocumented — see the comments on `api.savePlace`. In short:
  photos via `wp/v2/media` (Listar's `place/media_upload` fatals server-side), `place/save`
  form-encoded (resend title+content on every call or content is wiped; `gallery` = comma-separated
  ids), category + `featured_media` via `wp/v2/listar/{id}`, coordinates in a last best-effort
  `place/save` because the server lacks the `wp_listar_coordinates` table (coords are saved, then
  it errors with HTTP 400). New places are always `pending` (moderated in wp-admin).
- **API response cache** (`app/services/cache.js`, stale-while-revalidate): `cachedRequest()` in a
  saga hands the cached raw JSON to `onData` at once, then fetches and calls `onData` again only if
  the response changed — so a saga callback may fire **twice** (`fromCache: true`, then network).
  Raw JSON lives in its own AsyncStorage database `sab-api-cache` (not redux-persist, whose
  rehydration would strip the model classes); keys = user id | language | endpoint | params.
  Wired so far: `home/init` (24 h), first page of `sab/v1/events` + event detail (6 h). `force`
  bypasses the read (pull-to-refresh); creating an event evicts the events entries; 404/410 evicts
  the entry; `LOGOUT` clears everything; entries > 7 days are pruned at startup. Corollary: token
  validation at launch (`onValid` in `sagas/auth.js`) only signs out on an actual server answer —
  a network error used to log the user out (and would now also wipe the cache).
- **Analytics** (`@react-native-firebase/analytics`): all calls go through `app/services/analytics.js`
  (fire-and-forget, never throws). Sign-up funnel events: `add_place_click {signed_in}`,
  `add_place_login_prompt {action: shown|sign_in|later}`, `login`/`sign_up {method, source}` where
  `source` (`add_place`|`other`) is passed as a navigation param Home → SignIn → SignUp, and
  `place_submitted {with_photos}`. iOS links Analytics **without IDFA**
  (`$RNFirebaseAnalyticsWithoutAdIdSupport = true` in the Podfile) to avoid the ATT prompt. Debug:
  `adb shell setprop debug.firebase.analytics.app com.ayanga.sortirabangui` (Android) or launch arg
  `-FIRDebugEnabled` (iOS), then Firebase console → DebugView.
- **Keyboard handling** (`react-native-keyboard-controller`, `<KeyboardProvider>` in `app/index.js`):
  Android runs edge-to-edge (`edgeToEdgeEnabled=true`), so `adjustResize` no longer resizes the
  window and RN's own `KeyboardAvoidingView` lags/sticks for seconds after the keyboard hides. Use the
  library's components instead: its `KeyboardAvoidingView` (`behavior="padding"` on both platforms,
  offset 0) for short forms; for long forms (AddPlace, ProfileEdit) `KeyboardAwareScrollView` +
  footer in `KeyboardStickyView`, with `bottomOffset` ≈ footer height — never nest
  KeyboardAwareScrollView inside a KeyboardAvoidingView (double compensation hides the field).
- **Local native module `modules/sab-calendar`** (installed as `"sab-calendar": "file:modules/sab-calendar"`,
  autolinked, TurboModule with codegen spec `src/NativeSabCalendar.ts`): "Ajouter à mon agenda" in
  EventDetail. iOS presents `EKEventEditViewController` (no permission needed on iOS 17+, asks on
  15/16 — hence `NSCalendars*UsageDescription` in Info.plist); Android fires `ACTION_INSERT` on
  `CalendarContract.Events` (no permission). After changing its native code: `pod install` + rebuild.
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
