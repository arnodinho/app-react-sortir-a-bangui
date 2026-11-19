import * as actionTypes from './actionTypes';

/**
 * Cached: the callback may run twice (cache, then network).
 * options.force: bypass the cache (reload after a review).
 */
export const onLoadProduct = (params, callback = () => {}, {force} = {}) => {
  return {
    type: actionTypes.FETCH_PRODUCT_DETAIL,
    params,
    callback,
    force,
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

/** Cached: the callback may run twice. options.force: bypass the cache. */
export const onFetchCategory = (params, callback = () => {}, {force} = {}) => {
  return {
    type: actionTypes.GET_CATEGORY,
    params,
    callback,
    force,
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
