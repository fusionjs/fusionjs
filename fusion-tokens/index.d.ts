/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Token, Context} from 'fusion-core';

declare type Fetch = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;
declare const FetchToken: Token<Fetch>;
declare type Session = {
  from(ctx: Context): {
    get(keyPath: string): any;
    set(keyPath: string, val: any): void;
  };
};
declare const SessionToken: Token<Session>;
declare type Cache = {
  get(key: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  set(key: string, val: any): Promise<unknown>;
};
declare const CacheToken: Token<Cache>;
declare type LogCallback = (
  error?: any,
  level?: string,
  message?: string,
  meta?: any
) => void;
declare type LogEntry = {
  level: string;
  message: string;
  [optionName: string]: any;
};
declare type LogMethod = {
  (level: string, message: string, callback: LogCallback): Logger;
  (level: string, message: string, meta: any, callback: LogCallback): Logger;
  (level: string, message: string, ...meta: any[]): Logger;
  (entry: LogEntry): Logger;
};
declare type LeveledLogMethod = {
  (message: string, callback: LogCallback): Logger;
  (message: string, meta: any, callback: LogCallback): Logger;
  (message: string, ...meta: any[]): Logger;
  (infoObject: any): Logger;
};
declare type Logger = {
  log: LogMethod;
  error: LeveledLogMethod;
  warn: LeveledLogMethod;
  info: LeveledLogMethod;
  verbose: LeveledLogMethod;
  debug: LeveledLogMethod;
  silly: LeveledLogMethod;
};
declare const LoggerToken: Token<Logger>;

export {
  Cache,
  CacheToken,
  Fetch,
  FetchToken,
  Logger,
  LoggerToken,
  Session,
  SessionToken,
};
