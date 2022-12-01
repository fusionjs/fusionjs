/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';

export const AtomicPrefixToken = createToken<string>('EngineConfigToken');

export const workerRoute = '/__styletron_debugger_worker.js';
export const wasmRoute = '/__styletron_debugger_mappings.wasm';
