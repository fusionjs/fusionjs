/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';
import type {FusionPlugin, Token} from 'fusion-core';

import serverPlugin from './node';
import { matchesLiteralSections as _matchesLiteralSections } from './translate'
import clientPlugin, {HydrationStateToken} from './browser';
import serverLoader from './loader';
import type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
  TranslateFuncType,
} from './types.js';
import {I18nLoaderToken, I18nTranslateFnsToken} from './tokens.js';

const I18nToken: Token<I18nServiceType> = createToken('I18nToken');

const plugin: FusionPlugin<I18nDepsType, I18nServiceType> = __NODE__
  ? serverPlugin
  : clientPlugin;

const createI18nLoader: typeof serverLoader = __NODE__
  ? serverLoader
  : (void 0: any);

const matchesLiteralSections = __NODE__
  ? _matchesLiteralSections
  : (void 0: any);

export type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
  TranslateFuncType,
};
export default plugin;
export { I18nToken, I18nLoaderToken, I18nTranslateFnsToken, HydrationStateToken, createI18nLoader, matchesLiteralSections };
