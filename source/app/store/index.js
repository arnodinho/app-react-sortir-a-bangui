import AsyncStorage from '@react-native-async-storage/async-storage';
import {createStore, applyMiddleware} from 'redux';
import {persistStore, persistReducer} from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import logger from 'redux-logger';
import rootReducer from '@reducers';
import rootSagas from '@sagas';

/**
 * Redux Setting
 */
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['home', 'wishlist', 'list'],
  timeout: 100000,
};
const sagaMiddleware = createSagaMiddleware();

// redux-logger prints the whole (large, persisted) state on every action.
// On Android in dev that synchronous logging blocks the JS thread for seconds
// (thousands of log lines at startup) and the app stops responding to taps.
// Opt-in only: flip to true while debugging Redux.
const ENABLE_REDUX_LOGGER = false;

let middleware = [sagaMiddleware];
if (__DEV__ && ENABLE_REDUX_LOGGER) {
  middleware.push(logger);
}

const persistedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(persistedReducer, applyMiddleware(...middleware));
sagaMiddleware.run(rootSagas);
const persistor = persistStore(store);

export {store, persistor};
