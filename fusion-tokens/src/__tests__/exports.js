// @flow

import test from 'tape-cup';

import {FetchToken, SessionToken, LoggerToken, CacheToken} from '../index.js';

test('fusion-tokens exports', t => {
  t.ok(FetchToken, 'exports FetchToken');
  t.ok(SessionToken, 'exports SessionToken');
  t.ok(LoggerToken, 'exports LoggerToken');
  t.ok(CacheToken, 'exports CacheToken');
  t.end();
});
