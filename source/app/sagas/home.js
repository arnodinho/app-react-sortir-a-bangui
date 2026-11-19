import {all, put, takeEvery} from 'redux-saga/effects';
import * as actionTypes from '@actions/actionTypes';
import * as api from '@api';
import {ProductModel, CategoryModel} from '@models';
import {cachedRequest, cacheKey, HOUR} from '@services/cache';

function* saveHome(response) {
  if (response?.success) {
    yield put({
      type: actionTypes.SAVE_HOME_DATA,
      sliders: response.data?.sliders,
      categories: response.data?.categories?.map?.(item => {
        return new CategoryModel(item);
      }),
      locations: response.data?.locations?.map?.(item => {
        return new CategoryModel(item);
      }),
      // `popular` is added to home/init by wordpress/mu-plugins/sab-popular.php:
      // most interactions (reviews + favorites), topped up with the most
      // recent places. Fall back to the recent places if it's missing, so
      // the section isn't stuck on its loading placeholder.
      popular: (
        response.data?.popular ??
        response.data?.recent_posts ??
        []
      ).map?.(item => {
        return new ProductModel(item);
      }),
      recents: response.data?.recent_posts?.map?.(item => {
        return new ProductModel(item);
      }),
    });
  }
}

/** Cached for 24h: the last home shows instantly, then is refreshed. */
function* fetchHome(action) {
  try {
    let latest;
    yield* cachedRequest({
      key: cacheKey('home', action.params),
      maxAge: 24 * HOUR,
      force: action.force,
      request: () => api.getHome(action.params),
      onData: function* (response) {
        latest = response;
        yield* saveHome(response);
      },
    });
    action.callback?.(latest);
  } catch (error) {
    // console.log('fetchHome', error);
    action.callback?.(error.response ?? error.message);
  }
}

function* watchLoadHome() {
  yield takeEvery(actionTypes.FETCH_HOME, fetchHome);
}

export default function* authSagas() {
  yield all([watchLoadHome()]);
}
