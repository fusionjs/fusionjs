// @flow
import {createRPCReducer} from '../../../../';

export default createRPCReducer('getUser', {
  start: (state, action) => ({...state, loading: true}),
  success: (state, action) => ({
    ...state,
    loading: false,
    data: action.payload,
  }),
  failure: (state, action) => ({
    ...state,
    loading: false,
    error: action.payload.error,
  }),
});
