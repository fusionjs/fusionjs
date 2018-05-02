/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';
import type {FusionPlugin, Token} from 'fusion-core';

import serverPlugin, {I18nLoaderToken} from './node';
import clientPlugin, {HydrationStateToken} from './browser';
import createI18nLoader from './loader';
import type {I18nDepsType, I18nServiceType} from './flow.js';

export type {I18nServiceType} from './flow.js';
const I18nToken: Token<I18nServiceType> = createToken('I18nToken');

const plugin: FusionPlugin<I18nDepsType, I18nServiceType> = __NODE__
  ? serverPlugin
  : clientPlugin;

export default plugin;
export {I18nToken, I18nLoaderToken, HydrationStateToken, createI18nLoader};
