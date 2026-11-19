import {createAsyncStorage} from '@react-native-async-storage/async-storage';
import {call} from 'redux-saga/effects';
import i18n from 'i18next';
import {store} from '@store';

/**
 * API response cache ("stale-while-revalidate").
 *
 * Raw JSON responses are kept in their own AsyncStorage database (separate
 * from redux-persist, so clearing one never touches the other). Models are
 * rebuilt from the JSON on every read: redux-persist would hand back plain
 * objects without their class.
 *
 * Keys include the user (the API returns per-user fields such as the
 * favorite flag) and the language (Accept-Language changes the content).
 */

const storage = createAsyncStorage('sab-api-cache');

/** Entries older than this are dropped at startup whatever their own TTL. */
const MAX_AGE_ANY = 7 * 24 * 3600 * 1000;

export const HOUR = 3600 * 1000;

export const cacheKey = (name, params) => {
  const user = store.getState().auth?.user?.id ?? 0;
  const lang = i18n.language ?? '';
  return [user, lang, name, params ? JSON.stringify(params) : ''].join('|');
};

/** @returns {Promise<{data, raw: string}|null>} never throws */
export async function readCache(key, maxAge) {
  try {
    const value = await storage.getItem(key);
    if (!value) {
      return null;
    }
    const {t, d} = JSON.parse(value);
    if (Date.now() - t > maxAge) {
      storage.removeItem(key).catch(() => {});
      return null;
    }
    return {data: JSON.parse(d), raw: d};
  } catch (e) {
    return null;
  }
}

/** Never throws. */
export async function writeCache(key, raw) {
  try {
    await storage.setItem(key, JSON.stringify({t: Date.now(), d: raw}));
  } catch (e) {}
}

/** Removes every entry, or those whose key matches `predicate`. Never throws. */
export async function clearCache(predicate) {
  try {
    if (!predicate) {
      await storage.clear();
      return;
    }
    const keys = (await storage.getAllKeys()).filter(predicate);
    if (keys.length) {
      await storage.removeMany(keys);
    }
  } catch (e) {}
}

/** Drops entries nobody will read again (older than any TTL). Never throws. */
export async function pruneCache() {
  try {
    const keys = await storage.getAllKeys();
    if (!keys.length) {
      return;
    }
    const values = await storage.getMany(keys);
    const stale = keys.filter(key => {
      try {
        return Date.now() - JSON.parse(values[key]).t > MAX_AGE_ANY;
      } catch (e) {
        return true;
      }
    });
    if (stale.length) {
      await storage.removeMany(stale);
    }
  } catch (e) {}
}

/**
 * Saga helper: hands the cached response to `onData` right away (if any and
 * still fresh), then fetches from the network and calls `onData` again only
 * if the response changed.
 *
 * - `force`: skip the cache read (pull-to-refresh); the response is still stored.
 * - Only responses passing `isValid` (default: not `success: false`) are stored.
 * - On network failure the error is swallowed when cached data was shown,
 *   rethrown otherwise (the caller's usual error handling applies). A 404/410
 *   is always rethrown and evicts the entry.
 *
 * @param {{key: string, maxAge: number, request: () => Promise, onData: function*(data, fromCache), force?: boolean, isValid?: function}} options
 */
export function* cachedRequest({
  key,
  maxAge,
  request,
  onData,
  force = false,
  isValid = response => response?.success !== false,
}) {
  const cached = force ? null : yield call(readCache, key, maxAge);
  if (cached) {
    yield* onData(cached.data, true);
  }
  try {
    const response = yield call(request);
    const raw = JSON.stringify(response);
    if (raw !== cached?.raw) {
      yield* onData(response, false);
    }
    if (isValid(response)) {
      yield call(writeCache, key, raw);
    }
  } catch (error) {
    // Gone on the server (e.g. deleted event): drop it and report the error
    // even if the cached copy was already shown.
    const status = error?.response?.status;
    if (status === 404 || status === 410) {
      yield call(clearCache, k => k === key);
      throw error;
    }
    if (!cached) {
      throw error;
    }
  }
}
