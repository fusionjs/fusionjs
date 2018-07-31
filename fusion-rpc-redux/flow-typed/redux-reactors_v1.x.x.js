// @flow

/* eslint-disable  */

declare module 'redux-reactors' {
  import type {Reducer} from 'redux';

  declare type Reactor<TType, TPayload> = (payload: TPayload) => ({
    type: TType,
    payload: TPayload,
    __REACTOR__: any
  });
  declare function createReactor<TType, S>(type: TType, reducer: Reducer<TType, S>): Reactor<TType, *>;
}
