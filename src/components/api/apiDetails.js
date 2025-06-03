import { socketurl, streamBackendUrl } from "../../../config";

export const AWS_IMAGE_UPLOAD = "aws/image/upload?path=:path";

export const AZURE_IMAGE_UPLOAD = "azure/image/upload";



/************************************
 *         Login & Signup           *
 ************************************/
export const SIGNUP = "auth/signup";
export const EMAIL_LOGIN = "auth/login";
export const FORGOT_PASSWORD_REQUEST = "auth/forgot-password";
export const VERIFY_FORGOT_PASSWORD_OTP = "auth/forgot-password/verify";
export const RESET_PASSWORD = "auth/reset-password";
export const VERIFY_OTP = "auth/verify-otp";
export const RESEND_OTP = "auth/resend-otp";
export const LOGOUT = "auth/logout";


export const CATEGORY_ADD = "user/categories/add";
/************************************
 *               Tokens             *
 ************************************/
export const VALIDATE_ME = "auth/me";
export const REFRESH_TOKEN = "auth/refresh";

/************************************
 *               O Auth             *
 ************************************/
export const FACEBOOK_AUTH = "auth/facebook";
export const GOOGLE_AUTH = "auth/google";



/************************************
 *              user                *
 ************************************/
export const GET_USER_DETAILS_BY_ID = "user/id";

/************************************
 *            Categories            *
 ************************************/
export const GET_CATEGORIES = "categories/get";


/************************************
 *        Seller Application         *
************************************/
export const SELLER_APPLICATION = "apply/seller";
export const UPDATE_SELLER_APPLICATION = "apply/seller";

/************************************
 *         Product Listing          *
 ************************************/

export const CREATE_PRODUCT_LISTING = "product/listing";
export const UPDATE_PRODUCT_LISTING = "product/listing";
export const GET_PRODUCTS_BY_SELLER_ID = "product/listing/seller";
export const GET_PRODUCTS_BY_DROPSHIPPER = "product/listing/dropshipper";
export const GET_PRODUCT_BY_ID = "product/listing/seller";


/************************************
 *             Stocks               *
************************************/
export const UPDATE_STOCK = "stock";
export const GET_STOCKS_BY_SELLER_ID = "stock/seller";
export const GET_STOCK_BY_ID = "stock";

/************************************
 *              Shows               *
 ************************************/
export const CREATE_SHOW = "shows/create";
export const UPDATE_SHOW = "shows/update";
export const CANCEL_SHOW = "shows";
export const GET_SHOW_BY_ID = "shows/get";
export const GET_SHOWS_BY_SELLER_ID = "shows/seller";
export const GET_MY_SHOWS = "shows/myshows";
export const UPDATE_TAGGED_PRODUCTS = "shows/tag";
export const BASIC_SHOW_INFO = "shows/view";
export const START_LIVE_STREAM = "shows/:id/start";
export const END_LIVE_STREAM = "shows/:id/end";

/************************************
 *             Live Shows            *
 ************************************/
export const LIVE_SHOW_BY_ID = "live/shows/get";
export const ALL_LIVE_SHOWS = "live/shows";

/************************************
 *             Socket Api            *
 ************************************/
export const SOCKET_URL = `${socketurl}`;

/************************************
 *        Shoppable Videos          *
 ************************************/
export const CREATE_SHOPPABLE_VIDEO = "shoppable-videos/";
export const UPDATE_SHOPPABLE_VIDEO = "shoppable-videos/:id";
//(Seller Dashboard & for Users)
export const GET_SHOPPABLE_VIDEO_BY_ID = "shoppable-videos/:id";
//(Seller Dashboard)
export const DELETE_SHOPPABLE_VIDEO_BY_ID = "shoppable-videos/:id";
//(Seller Dashboard)
export const GET_SELLER_SHOPPABLE_VIDEOS = "shoppable-videos/seller";
export const GET_MY_SHOPPABLE_VIDEOS = "shoppable-videos/my-videos";
//(for Users)
export const GET_SHOPPABLE_VIDEOS_BY_SELLER_ID = "shoppable-videos/seller/:sellerId";
//(Seller Dashboard & for Users)
export const GET_ALL_SHOPPABLE_VIDEOS = "shoppable-videos/";

export const SHOPPABLE_VIDEO_VISIBILITY = "shoppable-videos/:id/visibility";
/************************************
 *        profile page              *
 ************************************/

export const SELLER_INFO = "profile-page/seller/:id";
export const SELLER_PRODUCTS = "profile-page/products/seller/:id";
export const SELLER_SHOWS = "profile-page/shows/seller/:id";


/************************************
 *             user feed             *
 ************************************/
export const USER_FEED_SHOWS = "user-feed/shows";
export const USER_FEED_PRODUCTS = "user-feed/products";
export const USER_FEED_SHOPPABLE_VIDEOS = "user-feed/shoppable-videos";
export const USER_PRODUCT = "product-details/:id";

/************************************
 *          Profile Page             *
 ************************************/
export const PAGINATED_PRODUCTS = "profile/:sellerId/products";
export const PAGINATED_FOLLOWERS = "follow/user-followers";
export const PAGINATED_FOLLOWINGS = "follow/user-followings";
export const PAGINATED_SHOWS = "profile/:hostId/shows";
export const PAGINATED_SHOPPABLE_VIDEOS = "profile/:hostId/shoppableVideos"
/************************************
*           search bar              *
************************************/
export const SEARCH_ENDPOINTS = {
    shows: 'search/shows',
    videos: 'search/videos',
    products: 'search/products',
    users: 'search/users',
};
/************************************
 * Shippers                *
 * ***********************************/
export const SHIPPER_APPLY = "shipper/apply";
export const SHIPPER_STATUS = "shipper/status";

/************************************
*            Azure SAS              *
**************************************/
export const IMAGE_UPLOADTO_AZURE = "azure/generate-document-sas";
// export const GENERATE_IMAGE_SAS_URL = "azure/generate-image-sas";
export const GENERATE_VIDEO_SAS_URL = "videos/generate-sas";
export const AZURE_SAS_ENDPOINT = "azure/generate-image-sas";
export const GENERATE_IMAGE_SAS_URL = "azure/generate-image-sas";

/************************************
*             own Stream            *
**************************************/
export const GET_ALL_AVAILABLE_STREAMS = `${streamBackendUrl}/stream/available-streams`
export const CREATE_NEW_STREAM = `${streamBackendUrl}/stream`
export const UPDATE_STREAM_DATA = `${streamBackendUrl}/stream`
export const GET_SINGLE_STREAM_DATA = `${streamBackendUrl}/stream`



/************************************
*             Cohost Api            *
**************************************/

export const COHOST_SEARCH = "cohost/users";
export const COHOST_INVITE = "cohost/invite/:showId";
export const COHOST_RECIVE = "cohost/invite/received";
export const ACTIVE_COHOST = "cohost/invited/:showId";
export const ACTIVE_COHOST_REMOVE = "cohost/cancel/:inviteId";


/**************************************************
*             User Add Address Api            *
****************************************************/

export const GET_VERIFICATION_STATUS = "user/verification/status";
export const INITIATE_AADHAAR_OTP = "user/verification/aadhaar/initiate";
export const VERIFY_AADHAAR_OTP = "user/verification/aadhaar/verify";
export const SELECT_ADDRESS = "user/verification/select-address";
export const INITIATE_PAYU_MANDATE = "user/payment/initiate-mandate";

// Address management APIs
export const GET_ADDRESS = "user/addresses";
export const ADD_ADDRESS = "user/addresses";
export const UPDATE_ADDRESS = "user/addresses/:id";
export const DELETE_ADDRESS = "user/addresses/:id";