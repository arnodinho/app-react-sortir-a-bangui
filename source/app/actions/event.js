import * as actionTypes from './actionTypes';

/**
 * params: {page, per_page, scope: 'upcoming'|'past'}
 * options.force: bypass the cache (pull-to-refresh).
 * The first page is cached, so the callback may run twice (cache, then network).
 */
export const onLoadEvents = (params, callback = () => {}, {force} = {}) => {
  return {
    type: actionTypes.GET_EVENTS,
    params,
    callback,
    force,
  };
};

export const onLoadEvent = (id, callback = () => {}) => {
  return {
    type: actionTypes.FETCH_EVENT_DETAIL,
    id,
    callback,
  };
};

/**
 * Publishes immediately (no moderation).
 * @param {object} params {title, content, start: Date, end: Date, venue,
 *   address, latitude, longitude, price, phone, website,
 *   images: [{uri, type, fileName}]}
 */
export const onCreateEvent = (params, callback = () => {}) => {
  return {
    type: actionTypes.CREATE_EVENT,
    params,
    callback,
  };
};
