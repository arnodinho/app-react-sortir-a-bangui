import {all, call, takeEvery} from 'redux-saga/effects';
import * as actionTypes from '@actions/actionTypes';
import * as api from '@api';
import {EventModel, PaginationModel} from '@models';
import {formatEventDateForApi} from '@models/event';
import {cachedRequest, cacheKey, clearCache, HOUR} from '@services/cache';

const EVENTS_MAX_AGE = 6 * HOUR;
const isEventKey = key => key.includes('|events');

const errorMessage = error =>
  error.response?.data?.message ?? error.response?.data?.code ?? error.message;

const eventsResult = (response, fromCache) => ({
  success: true,
  fromCache,
  list: (response.data ?? []).map(item => new EventModel(item)),
  pagination: new PaginationModel(response.pagination),
});

/**
 * The first page is cached: the callback may run twice, first with the cached
 * list (`fromCache: true`), then with the network one if it changed.
 * Next pages and `force` (pull-to-refresh) always come from the network.
 */
function* loadEvents(action) {
  try {
    if ((action.params?.page ?? 1) > 1) {
      const response = yield api.getEvents(action.params);
      action.callback?.(eventsResult(response, false));
      return;
    }
    yield* cachedRequest({
      key: cacheKey('events', action.params),
      maxAge: EVENTS_MAX_AGE,
      force: action.force,
      request: () => api.getEvents(action.params),
      onData: function* (response, fromCache) {
        action.callback?.(eventsResult(response, fromCache));
      },
    });
  } catch (error) {
    action.callback?.({success: false, message: errorMessage(error)});
  }
}

/** Cached like the list: the callback may run twice (cache, then network). */
function* loadEvent(action) {
  try {
    yield* cachedRequest({
      key: cacheKey('events/detail', {id: action.id}),
      maxAge: EVENTS_MAX_AGE,
      request: () => api.getEventDetail(action.id),
      onData: function* (response, fromCache) {
        action.callback?.({
          success: true,
          fromCache,
          event: new EventModel(response.data),
        });
      },
    });
  } catch (error) {
    action.callback?.({success: false, message: errorMessage(error)});
  }
}

/** Photos to the media library first, then one call creates the event. */
function* createEvent(action) {
  const {images = [], start, end, ...fields} = action.params;
  try {
    const mediaIds = [];
    for (const [index, image] of images.entries()) {
      const media = yield api.uploadMedia({
        uri: image.uri,
        type: image.type ?? 'image/jpeg',
        name: image.fileName ?? `event-${Date.now()}-${index}.jpg`,
      });
      mediaIds.push(media.id);
    }
    const response = yield api.createEvent({
      ...fields,
      start: formatEventDateForApi(start),
      end: formatEventDateForApi(end),
      gallery: mediaIds.join(','),
    });
    if (!response?.post_id) {
      throw new Error(response?.message ?? 'sab/v1/events: missing post_id');
    }
    // The new event must show up right away in every cached list.
    yield call(clearCache, isEventKey);
    action.callback?.({success: true, postId: response.post_id});
  } catch (error) {
    action.callback?.({success: false, message: errorMessage(error)});
  }
}

export default function* eventSagas() {
  yield all([
    takeEvery(actionTypes.GET_EVENTS, loadEvents),
    takeEvery(actionTypes.FETCH_EVENT_DETAIL, loadEvent),
    takeEvery(actionTypes.CREATE_EVENT, createEvent),
  ]);
}
