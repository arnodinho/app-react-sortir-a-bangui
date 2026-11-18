import * as actionTypes from './actionTypes';

export const onLogin = (params, callback = () => {}) => {
  return {
    type: actionTypes.LOGIN,
    params,
    callback,
  };
};

export const onEditProfile = (params, callback = () => {}) => {
  return {
    type: actionTypes.ON_UPDATE_PROFILE,
    params,
    callback,
  };
};

/**
 * @param {{uri: string, type?: string, fileName?: string}} image asset
 *   returned by react-native-image-picker
 */
export const onUploadAvatar = (image, callback = () => {}) => {
  return {
    type: actionTypes.ON_UPLOAD_AVATAR,
    image,
    callback,
  };
};

export const onLogout = () => {
  return {
    type: actionTypes.LOGOUT,
  };
};

export const onValid = (callback = () => {}) => {
  return {
    type: actionTypes.VALID_TOTEN,
    callback,
  };
};
