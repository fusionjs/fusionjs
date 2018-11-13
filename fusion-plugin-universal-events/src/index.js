/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';
import type {FusionPlugin, Token} from 'fusion-core';

import ServerEvents from './server.js';
import BrowserEvents from './browser.js';
import type {
  IEmitter,
  UniversalEventsPluginDepsType as DepsType,
} from './types.js';

const UniversalEventsPlugin = __BROWSER__ ? BrowserEvents : ServerEvents;

// eslint-disable-next-line prettier/prettier
export default ((UniversalEventsPlugin: any): FusionPlugin<DepsType, IEmitter>);

export const UniversalEventsToken: Token<IEmitter> = createToken(
  'UniversalEventsToken'
);

export * from './storage/index.js';

export type UniversalEventsDepsType = DepsType;
export type UniversalEventsType = IEmitter;
