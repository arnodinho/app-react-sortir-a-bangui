import {all, call, put, takeEvery} from 'redux-saga/effects';
import * as actionTypes from '@actions/actionTypes';
import * as api from '@api';
import {ProductModel, PaginationModel} from '@models';
import {evictPlace} from '@services/cache';

function* loadWishList(action) {
  try {
    const response = yield api.getWishList(action.params);
    if (response.success) {
      const list = response.data.map?.(item => {
        return new ProductModel(item);
      });
      const pagination = new PaginationModel(response.pagination);
      yield put({
        type: actionTypes.SAVE_WISHLIST,
        list,
        pagination,
      });
    }
    action.callback?.(response);
  } catch (error) {
    //console.log('loadWishList', error);
    action.callback?.(error.response ?? error.message);
  }
}

function* deleteWishList(action) {
  try {
    let response;
    if (action.params) {
      response = yield api.deleteWishList(action.params);
    } else {
      response = yield api.resetWishList();
    }
    // Cached place details carry the favorite flag.
    yield call(evictPlace, action.params?.post_id);
    yield put({type: actionTypes.GET_WISHLIST});
    action.callback?.(response);
  } catch (error) {
   // console.log('deleteWishList', error);
    action.callback?.(error.response ?? error.message);
  }
}

function* saveWishList(action) {
  try {
    const form = new FormData();
    for (let key in action.params) {
      form.append(key, action.params[key]);
    }
    let response;
    if (action.like) {
      response = yield api.saveWishList(form);
    } else {
      response = yield api.deleteWishList(form);
    }
    if (response.success) {
      yield call(evictPlace, action.params?.post_id);
      // Keep the Favoris tab in sync (it only reloaded on pull-to-refresh).
      yield put({type: actionTypes.GET_WISHLIST});
    }
    action.callback?.({success: !!response.success, message: response.message});
  } catch (error) {
    // e.g. 400 "not available in free version" when the Listar license is
    // inactive: the caller must not show the place as saved.
    action.callback?.({
      success: false,
      message: error.response?.data?.message ?? error.message,
    });
  }
}

function* watchLoad() {
  yield takeEvery(actionTypes.GET_WISHLIST, loadWishList);
}

function* watchDelete() {
  yield takeEvery(actionTypes.DELETE_WISHLIST, deleteWishList);
}

function* watchSave() {
  yield takeEvery(actionTypes.ON_LIKE, saveWishList);
}

export default function* authSagas() {
  yield all([watchLoad(), watchDelete(), watchSave()]);
}
