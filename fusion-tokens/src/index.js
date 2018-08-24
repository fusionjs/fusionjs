// @flow

import {createToken} from 'fusion-core';
import type {Context, Token} from 'fusion-core';

// Tokens
export type Fetch = (
  input: string | Request,
  init?: RequestOptions
) => Promise<Response>;
export const FetchToken: Token<Fetch> = createToken('FetchToken');

export type Session = {
  from(
    ctx: Context
  ): {
    get(keyPath: string): any,
    set(keyPath: string, val: any): void,
  },
};
export const SessionToken: Token<Session> = createToken('SessionToken');

export type Cache = {
  get(key: string): Promise<mixed>,
  del(key: string): Promise<mixed>,
  set(key: string, val: any): Promise<mixed>,
};

export const CacheToken: Token<Cache> = createToken('CacheToken');

type LogCallback = (
  error?: any,
  level?: string,
  message?: string,
  meta?: any
) => void;

type LogEntry = {
  level: string,
  message: string,
  [optionName: string]: any,
};

type LogMethod = {
  (level: string, message: string, callback: LogCallback): Logger,
  (level: string, message: string, meta: any, callback: LogCallback): Logger,
  (level: string, message: string, ...meta: any[]): Logger,
  (entry: LogEntry): Logger,
};

type LeveledLogMethod = {
  (message: string, callback: LogCallback): Logger,
  (message: string, meta: any, callback: LogCallback): Logger,
  (message: string, ...meta: any[]): Logger,
  (infoObject: Object): Logger,
};

export type Logger = {
  log: LogMethod,
  error: LeveledLogMethod,
  warn: LeveledLogMethod,
  info: LeveledLogMethod,
  verbose: LeveledLogMethod,
  debug: LeveledLogMethod,
  silly: LeveledLogMethod,
};
export const LoggerToken: Token<Logger> = createToken('LoggerToken');
