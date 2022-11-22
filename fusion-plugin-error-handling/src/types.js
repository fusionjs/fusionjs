/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FusionPlugin, Context} from 'fusion-core';

import {ErrorHandlingEmitterToken} from './client.js';
import {ErrorHandlerToken} from './server.js';

type DepsType = {
  onError?: typeof ErrorHandlerToken,
  emit?: typeof ErrorHandlingEmitterToken.optional,
};

export type ErrorHandlerPluginType = FusionPlugin<DepsType, empty>;

export type ErrorHandlerType = (
  e: Error,
  captureType: string,
  ctx: ?Context
) => Promise<*> | void;

export type ErrorSerializerType = (e: mixed) => String;
