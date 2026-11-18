import * as actionTypes from './actionTypes';

export const onLoadProduct = (params, callback = () => {}) => {
  return {
    type: actionTypes.FETCH_PRODUCT_DETAIL,
    params,
    callback,
  };
};

export const onLoadReview = (params, callback = () => {}) => {
  return {
    type: actionTypes.GET_COMMENT,
    params,
    callback,
  };
};

export const onFeekBack = (params, callback = () => {}) => {
  return {
    type: actionTypes.SAVE_COMMENT,
    params,
    callback,
  };
};

export const onFetchCategory = (params, callback = () => {}) => {
  return {
    type: actionTypes.GET_CATEGORY,
    params,
    callback,
  };
};

export const onLoadPlaceForm = (callback = () => {}) => {
  return {
    type: actionTypes.GET_PLACE_FORM,
    callback,
  };
};

/**
 * @param {object} params {title, content, category, address, phone, email,
 *   website, latitude, longitude, images: [{uri, type, fileName}]}
 */
export const onCreatePlace = (params, callback = () => {}) => {
  return {
    type: actionTypes.CREATE_PLACE,
    params,
    callback,
  };
};
