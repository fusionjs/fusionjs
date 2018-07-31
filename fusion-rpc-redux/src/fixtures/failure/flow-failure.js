// @flow
import type {Reducer} from 'redux';
import {createRPCReducer} from '../../index.js';

type UserDataType = {
  firstName: string,
  lastName: string,
};
type ErrorType = {
  message: string,
};

export type UserStateType = {|
  loading: boolean,
  data: ?UserDataType,
  error: ?ErrorType,
|};

export type UserActionType = {|
  type: string,
  payload: {
    data: ?UserDataType,
    error: ?ErrorType,
  },
|};

const UserReducer: Reducer<UserStateType, UserActionType> = createRPCReducer(
  'getUser',
  {
    start: () => {
      return {
        loading: true,
      };
    },
    success: (state, action) => {
      return {
        ...state,
        loading: 'test',
        data: action.payload.data,
      };
    },
    failure: (state, action) => {
      return {
        loading: false,
        data: null,
        error: action.payload.error,
        extra: 'test',
      };
    },
  },
  {
    loading: false,
    data: null,
    error: null,
    test: 'test',
  }
);

export default UserReducer;
