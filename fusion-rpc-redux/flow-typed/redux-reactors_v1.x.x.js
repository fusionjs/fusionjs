// @flow

/* eslint-disable  */

declare module 'redux-reactors' {
  import type {Reducer} from 'redux';

  declare type Reactor<TType, TPayload> = (payload: TPayload) => ({
    type: TType,
    payload: TPayload,
    __REACTOR__: boolean
  });
  declare function createReactor<TType>(type: TType, reducer: Reducer<*, *>): Reactor<TType, *>;
}
