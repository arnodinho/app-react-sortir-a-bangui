import * as actionTypes from './actionTypes';

/**
 * The first page is cached: the callback may run twice (cache, then network).
 * options.force: bypass the cache (pull-to-refresh).
 */
export const onLoadList = (filter, page, callback = () => {}, {force} = {}) => {
  return {
    type: actionTypes.LOAD_LIST,
    filter,
    page,
    callback,
    force,
  };
};

export const onUpdate = item => {
  return {
    type: actionTypes.ON_UPDATE_LIST,
    item,
  };
};
