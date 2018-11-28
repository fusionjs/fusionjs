// @flow

import type {Token} from 'fusion-core';
import type {BatchStorage} from '../types';
import {createToken} from 'fusion-core';

export const UniversalEventsBatchStorageToken: Token<BatchStorage> = createToken(
  'UniversalEventsBatchStorageToken'
);

export {inMemoryBatchStorage} from './in-memory.js';
export {localBatchStorage} from './local-storage.js';
