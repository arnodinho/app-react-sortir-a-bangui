import {
  getAnalytics,
  logEvent,
  logLogin,
  logSignUp,
  setUserId,
} from '@react-native-firebase/analytics';

/**
 * Thin wrapper around Firebase Analytics (modular API).
 *
 * Every call is fire-and-forget and swallows errors: analytics must never
 * break a user flow (sign-up, login, place creation).
 *
 * `source` tells where a sign-in / sign-up flow started, so the
 * "add place" prompt's effect on registrations can be measured:
 *   - 'add_place' : from the Home "+" button prompt (signed-out user)
 *   - 'review'    : from "add a review" on the reviews screen (signed-out user)
 *   - 'other'     : any other entry point (Profile tab, Wishlist tab…)
 *
 * Custom parameters (source, signed_in, action) only show up in GA4 reports
 * once registered as custom dimensions in the Firebase/GA4 console.
 */

const safely = fn => {
  try {
    const result = fn();
    result?.catch?.(error => console.warn('[analytics]', error?.message));
  } catch (error) {
    console.warn('[analytics]', error?.message);
  }
};

const analytics = () => getAnalytics();

export const trackSignUp = (source = 'other') =>
  safely(() => logSignUp(analytics(), {method: 'password', source}));

export const trackLogin = (source = 'other') =>
  safely(() => logLogin(analytics(), {method: 'password', source}));

export const identifyUser = userId =>
  safely(() =>
    setUserId(analytics(), userId != null ? String(userId) : null),
  );

/** Tap on the Home "+" button. */
export const trackAddPlaceClick = signedIn =>
  safely(() =>
    logEvent(analytics(), 'add_place_click', {signed_in: signedIn ? 1 : 0}),
  );

/** Sign-in prompt shown to a signed-out user: action = shown|sign_in|later. */
export const trackAddPlaceLoginPrompt = action =>
  safely(() => logEvent(analytics(), 'add_place_login_prompt', {action}));

/** A place was successfully submitted for review. */
export const trackPlaceSubmitted = withPhotos =>
  safely(() =>
    logEvent(analytics(), 'place_submitted', {with_photos: withPhotos ? 1 : 0}),
  );
