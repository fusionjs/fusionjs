// @flow
import {combineReducers} from 'redux';
import userReducer from './reducers/user.js';

export default combineReducers({
  user: userReducer,
});
