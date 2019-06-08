/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {Locale} from 'locale';

import {FetchToken} from 'fusion-tokens';
import type {Context} from 'fusion-core';

import {HydrationStateToken} from './browser';
import {I18nLoaderToken} from './tokens.js';

export type TranslationsObjectType = {[string]: string};

export type TranslateFuncType = (
  key: string,
  interpolations?: TranslationsObjectType
) => string;

export type I18nDepsType = {
  fetch?: typeof FetchToken.optional,
  hydrationState?: typeof HydrationStateToken.optional,
  loader?: typeof I18nLoaderToken.optional,
};

export type I18nServiceType = {
  from: (
    ctx: Context
  ) => {
    +locale?: string | Locale,
    +translations?: TranslationsObjectType,
    +load: (Array<string>) => Promise<void>,
    +translate: TranslateFuncType,
  },
};
