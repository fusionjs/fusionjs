// @flow

/* eslint-disable  */

declare module 'redux-reactors' {
  import type {Reducer, StoreCreator} from 'redux';

  declare type Reactor<TType, TPayload> = (payload: TPayload) => ({
    type: TType,
    payload: TPayload,
    __REACTOR__: boolean
  });
  declare function createReactor<TType>(type: TType, reducer: Reducer<*, *>): Reactor<TType, *>;

  declare function reactorEnhancer(createStore: StoreCreator<*, *, *>): StoreCreator<*, *, *>;
}
