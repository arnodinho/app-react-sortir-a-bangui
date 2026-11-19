import network from '@services/network';

const endPoints = {
  login: 'index.php/wp-json/jwt-auth/v1/token',
  valid: 'index.php/wp-json/jwt-auth/v1/token/validate',
  signUp: 'index.php/wp-json/listar/v1/auth/register',
  resetPassword: 'index.php/wp-json/listar/v1/auth/reset_password',
  userInfo: 'index.php/wp-json/listar/v1/auth/user',
  updateProfile: 'index.php/wp-json/wp/v2/users/me',
  uploadMedia: 'index.php/wp-json/wp/v2/media',
  changePassword: 'index.php/wp-json/wp/v2/users/me',
  // Favorites: our own routes (wordpress/mu-plugins/sab-favorites.php), same
  // storage as Listar, whose wishlist/save needs a Pro license we don't have.
  wishList: 'index.php/wp-json/sab/v1/favorites',
  resetWishList: 'index.php/wp-json/sab/v1/favorites/reset',
  deleteWishList: 'index.php/wp-json/sab/v1/favorites/remove',
  getHome: 'index.php/wp-json/listar/v1/home/init',
  productDetail: 'index.php/wp-json/listar/v1/place/view',
  getReview: 'index.php/wp-json/listar/v1/comments',
  saveReview: 'index.php/wp-json/wp/v2/comments',
  getCategory: 'index.php/wp-json/listar/v1/category/list',
  getList: 'index.php/wp-json/listar/v1/place/list',
  saveWishList: 'index.php/wp-json/sab/v1/favorites/add',
  setting: 'index.php/wp-json/listar/v1/setting/init',
  area: 'index.php/wp-json/listar/v1/location/list',
  placeForm: 'index.php/wp-json/listar/v1/place/form',
  placeSave: 'index.php/wp-json/listar/v1/place/save',
  placeWp: 'index.php/wp-json/wp/v2/listar',
  // Custom endpoint, served by wordpress/mu-plugins/sab-contact.php (repo root).
  contact: 'index.php/wp-json/sab/v1/contact',
  // Custom endpoint, served by wordpress/mu-plugins/sab-account-deletion.php.
  deleteAccount: 'index.php/wp-json/sab/v1/account/delete',
  // Agenda, served by wordpress/mu-plugins/sab-events.php.
  events: 'index.php/wp-json/sab/v1/events',
};

export const fetchLogin = params => {
  return network.post(endPoints.login, {params});
};

export const fetchValid = params => {
  return network.post(endPoints.valid, {params});
};

export const getSetting = params => {
  return network.get(endPoints.setting, {params});
};

export const signUp = params => {
  return network.post(endPoints.signUp, {params});
};

/** Sends the WordPress "reset your password" e-mail. params: {email}. */
export const resetPassword = params => {
  return network.post(endPoints.resetPassword, {params});
};

export const updateProfile = params => {
  return network.post(endPoints.updateProfile, {params});
};

/**
 * Upload a file to the WordPress media library. `file` is
 * {uri, type, name}; resolves to the created attachment (with `id`).
 */
export const uploadMedia = file => {
  const form = new FormData();
  form.append('file', file);
  return network.post(endPoints.uploadMedia, {
    params: form,
    headers: {'Content-Type': 'multipart/form-data'},
  });
};

/**
 * Set the current user's profile photo to a media attachment id.
 * The Listar plugin reads `listar_user_photo` from the form body ($_POST):
 * it is not a registered REST field, so a JSON body is silently ignored.
 */
export const updateProfilePhoto = attachmentId => {
  return network.post(endPoints.updateProfile, {
    params: `listar_user_photo=${encodeURIComponent(attachmentId)}`,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  });
};

const toFormBody = params =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

export const getPlaceForm = params => {
  return network.get(endPoints.placeForm, {params});
};

/**
 * Create (no post_id) or update (post_id) a place via the Listar plugin.
 * Must be form-encoded: the plugin reads $_POST, a JSON body only saves the
 * title/content. Caveats observed on the backend:
 * - fields that are not sent keep their value, EXCEPT `content`, which is
 *   wiped — always resend title + content;
 * - `category`/`feature` are ignored here (use updatePlaceWp);
 * - `gallery` is a comma-separated list of attachment ids;
 * - sending latitude+longitude together fails with "Table
 *   wp_listar_coordinates does not exist" (server misconfiguration), although
 *   the coordinates ARE saved before the error.
 * New places are always created with status "pending" (moderation).
 */
export const savePlace = params => {
  return network.post(endPoints.placeSave, {
    params: toFormBody(params),
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  });
};

/**
 * Standard WP REST update of a place: used for taxonomies
 * (listar_category, listar_feature) and featured_media, which
 * listar/v1/place/save does not handle.
 */
export const updatePlaceWp = (id, params) => {
  return network.post(`${endPoints.placeWp}/${id}`, {params});
};

export const deleteAccount = () => {
  return network.post(endPoints.deleteAccount, {});
};

export const sendContactMessage = params => {
  return network.post(endPoints.contact, {params});
};

export const getUserInfo = params => {
  return network.get(endPoints.userInfo, {params});
};

export const changePassword = params => {
  return network.post(endPoints.changePassword, {params});
};

export const getWishList = params => {
  return network.get(endPoints.wishList, {params});
};

export const resetWishList = params => {
  return network.post(endPoints.resetWishList, {params});
};

export const deleteWishList = params => {
  return network.post(endPoints.deleteWishList, {params});
};

export const getHome = params => {
  return network.get(endPoints.getHome, {params});
};

export const getProductDetail = params => {
  return network.get(endPoints.productDetail, {params});
};

export const saveWishList = params => {
  return network.post(endPoints.saveWishList, {params});
};

export const getReview = params => {
  return network.get(endPoints.getReview, {params});
};

export const saveReview = params => {
  return network.post(endPoints.saveReview, {params});
};

export const getCategory = params => {
  return network.get(endPoints.getCategory, {params});
};

export const getListProduct = params => {
  return network.get(endPoints.getList, {params});
};

export const getListArea = params => {
  return network.get(endPoints.area, {params});
};

/**
 * Agenda. params: {page, per_page, scope: 'upcoming'|'past', s}.
 * Resolves to {success, data: [event], pagination}.
 */
export const getEvents = params => {
  return network.get(endPoints.events, {params});
};

export const getEventDetail = id => {
  return network.get(`${endPoints.events}/${id}`, {});
};

/**
 * Create an event: published immediately, no moderation (admin gets an
 * e-mail and can unpublish it in wp-admin).
 * params: {title, content, start, end, venue, address, latitude, longitude,
 * price, phone, website, gallery: comma-separated wp/v2/media ids}.
 */
export const createEvent = params => {
  return network.post(endPoints.events, {params});
};
