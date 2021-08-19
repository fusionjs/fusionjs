/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Context, Token, FusionPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';

declare type MapFnType<TInput, TOutput> = (
  payload: TInput,
  ctx?: Context
) => TOutput;
declare type HandlerFnType<TInput> = (
  payload: TInput,
  ctx?: Context,
  type?: string
) => void | Promise<void>;
interface IEmitter {
  from(ctx: Context): IEmitter;
  emit(type: string, payload: unknown, ctx?: Context): void;
  setFrequency(frequency: number): void;
  teardown(): void;
  map<TIn = any, TOut = any>(
    type: string,
    callback: MapFnType<TIn, TOut>
  ): void;
  map<TIn = any, TOut = any>(callback: MapFnType<TIn, TOut>): void;
  on<TIn = any>(type: string, callback: HandlerFnType<TIn>): void;
  on<TIn = any>(callback: HandlerFnType<TIn>): void;
  off<TIn = any>(type: string, callback: HandlerFnType<TIn>): void;
  off<TIn = any>(callback: HandlerFnType<TIn>): void;
  mapEvent(type: string, payload: unknown, ctx?: Context): any;
  handleEvent(type: string, payload: unknown, ctx?: Context): void;
  flush(): void;
}
declare type BatchType = {
  type: unknown;
  payload: unknown;
};
interface BatchStorage {
  add(toBeAdded: BatchType): void;
  addToStart(...toBeAdded: BatchType[]): void;
  getAndClear(limit: number): BatchType[];
}
declare type UniversalEventsPluginDepsType = {
  fetch: typeof FetchToken;
};

declare class InMemoryBatchStorage implements BatchStorage {
  data: BatchType[];
  add: (...toBeAdded: BatchType[]) => void;
  addToStart: (...toBeAdded: BatchType[]) => void;
  getAndClear: (limit?: number) => BatchType[];
}
declare const inMemoryBatchStorage: InMemoryBatchStorage;

declare const localBatchStorage: BatchStorage;

declare const UniversalEventsBatchStorageToken: Token<BatchStorage>;

declare const UniversalEventsPlugin: FusionPlugin<
  UniversalEventsPluginDepsType,
  IEmitter
>;

declare const UniversalEventsToken: Token<IEmitter>;

declare type UniversalEventsDepsType = UniversalEventsPluginDepsType;
declare type UniversalEventsType = IEmitter;

export {
  UniversalEventsBatchStorageToken,
  UniversalEventsDepsType,
  UniversalEventsToken,
  UniversalEventsType,
  UniversalEventsPlugin as default,
  inMemoryBatchStorage,
  localBatchStorage,
};
