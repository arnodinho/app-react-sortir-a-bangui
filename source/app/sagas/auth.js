import {all, put, takeEvery, delay} from 'redux-saga/effects';
import * as actionTypes from '@actions/actionTypes';
import * as api from '@api';
import {
  getMessaging,
  requestPermission,
  getToken,
} from '@react-native-firebase/messaging';
import {UserModel} from '@models';
import {identifyUser} from '@services/analytics';

function* onLogin(action) {
  try {
    // Push registration is best-effort: on the iOS simulator (and on devices
    // where the user denies notifications) getToken() throws because there is
    // no APNs token. That must not prevent the user from logging in.
    try {
      const messagingInstance = getMessaging();
      yield requestPermission(messagingInstance);
      const token = yield getToken(messagingInstance);
      yield put({type: actionTypes.SAVE_DEVICE_TOKEN, token});
      yield delay(250);
    } catch (pushError) {
      console.warn('FCM token unavailable, logging in without it', pushError);
    }
    const response = yield api.fetchLogin(action.params);
    if (response.success) {
      const user = new UserModel(response.data);
      identifyUser(user.id);
      yield put({type: actionTypes.LOGIN_SUCCESS, user: user});
      yield put({type: actionTypes.GET_WISHLIST});
    }
    action.callback?.(response);
  } catch (error) {
    action.callback?.(error.response ?? error.message);
  }
}

function* onValid(action) {
  try {
    const response = yield api.fetchValid();
    if (response.code === 'jwt_auth_valid_token') {
      yield put({type: actionTypes.GET_WISHLIST});
      yield put({type: actionTypes.GET_USER_INFO});
    } else {
      yield put({type: actionTypes.LOGOUT});
    }
    action.callback?.(response);
  } catch (error) {
    // Only an actual answer from the server (jwt-auth replies 403 for an
    // invalid/expired token) signs out. No network at launch must not: the
    // user would be logged out, and the cached API data wiped with it.
    if (error.response) {
      yield put({type: actionTypes.LOGOUT});
    }
    action.callback?.(error.response ?? error.message);
  }
}

function* onGetInfo(action) {
  try {
    const response = yield api.getUserInfo();
    if (response.success) {
      const user = new UserModel(response.data);
      yield put({type: actionTypes.UPDATE_USER, user: user});
    } else if (response?.code === 'rest_permission') {
      // The JWT is still "valid" (jwt-auth only checks its signature) but the
      // account no longer exists, e.g. deleted from another device or from
      // the /supprimer-mon-compte/ page: sign out.
      identifyUser(null);
      yield put({type: actionTypes.LOGOUT});
    }
    action.callback?.(response);
  } catch (error) {
    action.callback?.(error.response ?? error.message);
  }
}

function* updateInfo(action) {
  try {
    const response = yield api.updateProfile(action.params);
    yield put({type: actionTypes.GET_USER_INFO});
    action.callback?.(response);
  } catch (error) {
    action.callback?.(error.response ?? error.message);
  }
}

function* uploadAvatar(action) {
  try {
    const {uri, type, fileName} = action.image;
    const media = yield api.uploadMedia({
      uri,
      type: type ?? 'image/jpeg',
      name: fileName ?? `avatar-${Date.now()}.jpg`,
    });
    yield api.updateProfilePhoto(media.id);
    yield put({type: actionTypes.GET_USER_INFO});
    action.callback?.({success: true});
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

function* watchLogin() {
  yield takeEvery(actionTypes.LOGIN, onLogin);
}

function* watchValid() {
  yield takeEvery(actionTypes.VALID_TOTEN, onValid);
}

function* watchGetInfo() {
  yield takeEvery(actionTypes.GET_USER_INFO, onGetInfo);
}

function* watchEditProfile() {
  yield takeEvery(actionTypes.ON_UPDATE_PROFILE, updateInfo);
}

function* watchUploadAvatar() {
  yield takeEvery(actionTypes.ON_UPLOAD_AVATAR, uploadAvatar);
}

export default function* authSagas() {
  yield all([
    watchLogin(),
    watchValid(),
    watchGetInfo(),
    watchEditProfile(),
    watchUploadAvatar(),
  ]);
}
