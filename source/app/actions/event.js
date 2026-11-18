import * as actionTypes from './actionTypes';

/** params: {page, per_page, scope: 'upcoming'|'past'} */
export const onLoadEvents = (params, callback = () => {}) => {
  return {
    type: actionTypes.GET_EVENTS,
    params,
    callback,
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
