import {all, takeEvery} from 'redux-saga/effects';
import * as actionTypes from '@actions/actionTypes';
import * as api from '@api';
import {EventModel, PaginationModel} from '@models';
import {formatEventDateForApi} from '@models/event';

const errorMessage = error =>
  error.response?.data?.message ?? error.response?.data?.code ?? error.message;

function* loadEvents(action) {
  try {
    const response = yield api.getEvents(action.params);
    action.callback?.({
      success: true,
      list: (response.data ?? []).map(item => new EventModel(item)),
      pagination: new PaginationModel(response.pagination),
    });
  } catch (error) {
    action.callback?.({success: false, message: errorMessage(error)});
  }
}

function* loadEvent(action) {
  try {
    const response = yield api.getEventDetail(action.id);
    action.callback?.({success: true, event: new EventModel(response.data)});
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
