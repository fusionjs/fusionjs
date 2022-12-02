import type {Reducer} from 'redux';
import {createRPCReducer} from '../../index';

type UserDataType = {
  firstName: string;
  lastName: string;
};

type ErrorType = {
  message: string;
};

export type UserStateType = {
  loading: boolean;
  data?: UserDataType;
  error?: ErrorType;
};

export type UserActionType = {
  type: string;
  payload: {
    data?: UserDataType;
    error?: ErrorType;
  };
};

const UserReducer = createRPCReducer<UserStateType, UserActionType>(
  'getUser',
  {
    start: (state) => {
      return {
        ...state,
        loading: true,
      };
    },
    // @ts-expect-error todo(flow->ts) this does not pass typecheck… should this be a test?
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
