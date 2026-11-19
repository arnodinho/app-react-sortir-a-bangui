import {all, call, takeEvery} from 'redux-saga/effects';
import * as actionTypes from '@actions/actionTypes';
import * as api from '@api';
import {ProductModel, CommentModel, RatingModel, CategoryModel} from '@models';
import {cachedRequest, evictPlace, placeKey, HOUR} from '@services/cache';

/**
 * Cached for 7 days: the callback may run twice, first with the cached place,
 * then with the network one if it changed. `force` skips the cache.
 */
function* fetchProduct(action) {
  try {
    yield* cachedRequest({
      key: placeKey(action.params?.id),
      maxAge: 7 * 24 * HOUR,
      force: action.force,
      request: () => api.getProductDetail(action.params),
      onData: function* (response) {
        if (response.success) {
          action.callback?.(new ProductModel(response.data));
        }
      },
    });
  } catch (error) {
   // console.log('fetchProduct', error);
    action.callback?.(error.response ?? error.message);
  }
}

function* loadReview(action) {
  try {
    const response = yield api.getReview(action.params);
    if (response.success) {
      const rating = new RatingModel(response.attr?.rating);
      const list = response.data?.map?.(item => {
        return new CommentModel(item);
      });
      action.callback?.({list, rating});
    }
  } catch (error) {
   // console.log('fetchReview', error);
    action.callback?.(error.response ?? error.message);
  }
}

function* saveComment(action) {
  try {
    const form = new FormData();
    for (let key in action.params) {
      form.append(key, action.params[key]);
    }
    const response = yield api.saveReview(form);
    // The place's rating and comment count changed (Feedback sends `post`).
    yield call(evictPlace, action.params?.post);
    action.callback?.(response);
  } catch (error) {
    //console.log('saveComment', error);
    action.callback?.(error.response ?? error.message);
  }
}

function* loadCategory(action) {
  try {
    const response = yield api.getCategory(action.params);
    if (response.success) {
      const list = response.data?.map?.(item => {
        return new CategoryModel(item);
      });
      action.callback?.(list);
    }
  } catch (error) {
   // console.log('getCategory', error);
    action.callback?.(error.response ?? error.message);
  }
}

function* watchLoadProduct() {
  yield takeEvery(actionTypes.FETCH_PRODUCT_DETAIL, fetchProduct);
}

function* watchLoadReview() {
  yield takeEvery(actionTypes.GET_COMMENT, loadReview);
}

function* watchSaveComment() {
  yield takeEvery(actionTypes.SAVE_COMMENT, saveComment);
}

function* loadPlaceForm(action) {
  try {
    const response = yield api.getPlaceForm();
    action.callback?.({success: true, data: response});
  } catch (error) {
    action.callback?.({
      success: false,
      message:
        error.response?.data?.message ??
        error.response?.data?.code ??
        error.message,
    });
  }
}

/**
 * Create a place. See api.savePlace for the backend quirks this works
 * around; the order of calls matters.
 */
function* createPlace(action) {
  const {
    title,
    content,
    category,
    location,
    address,
    phone,
    email,
    website,
    latitude,
    longitude,
    images = [],
  } = action.params;
  try {
    // 1. Photos go to the media library first (place/media_upload crashes
    //    server-side).
    const mediaIds = [];
    for (const [index, image] of images.entries()) {
      const media = yield api.uploadMedia({
        uri: image.uri,
        type: image.type ?? 'image/jpeg',
        name: image.fileName ?? `place-${Date.now()}-${index}.jpg`,
      });
      mediaIds.push(media.id);
    }

    // 2. Create the place (no coordinates, see 4.).
    const base = {title, content};
    const created = yield api.savePlace({
      ...base,
      country: location?.country,
      state: location?.state,
      city: location?.city,
      address,
      phone,
      email,
      website,
      gallery: mediaIds.length ? mediaIds.join(',') : undefined,
    });
    const postId = created?.post_id;
    if (!postId) {
      throw new Error(created?.message ?? 'place/save: missing post_id');
    }

    // 3. Category + main photo.
    yield api.updatePlaceWp(postId, {
      listar_category: category ? [category] : [],
      ...(mediaIds.length ? {featured_media: mediaIds[0]} : {}),
    });

    // 4. Coordinates last and best-effort: the backend saves them but then
    //    errors out (missing wp_listar_coordinates table).
    if (latitude != null && longitude != null) {
      try {
        yield api.savePlace({post_id: postId, ...base, latitude, longitude});
      } catch (error) {
        console.warn(
          'place/save coordinates',
          error.response?.data?.message ?? error.message,
        );
      }
    }

    action.callback?.({success: true, postId});
  } catch (error) {
    action.callback?.({
      success: false,
      message:
        error.response?.data?.message ??
        error.response?.data?.code ??
        error.message,
    });
  }
}

function* watchGetPlaceForm() {
  yield takeEvery(actionTypes.GET_PLACE_FORM, loadPlaceForm);
}

function* watchCreatePlace() {
  yield takeEvery(actionTypes.CREATE_PLACE, createPlace);
}

function* watchGetCategory() {
  yield takeEvery(actionTypes.GET_CATEGORY, loadCategory);
}

export default function* authSagas() {
  yield all([
    watchLoadProduct(),
    watchLoadReview(),
    watchSaveComment(),
    watchGetCategory(),
    watchGetPlaceForm(),
    watchCreatePlace(),
  ]);
}
