/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {FusionPlugin, ErrorHandlerType} from 'fusion-core';

import {ErrorHandlingEmitterToken} from './client';
import {ErrorHandlerToken} from './server';

type DepsType = {
  onError?: typeof ErrorHandlerToken;
  emit?: typeof ErrorHandlingEmitterToken.optional;
};

export type ErrorHandlerPluginType = FusionPlugin<DepsType, never>;

export type {ErrorHandlerType};
