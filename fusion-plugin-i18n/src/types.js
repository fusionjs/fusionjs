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
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import {HydrationStateToken} from './browser';
import {I18nLoaderToken, I18nTranslateFnsToken} from './tokens.js';

export type TranslationsObjectType = {[string]: string};

type ExtractReturnType = <V>(() => V) => V;

export type TranslateFuncType = (
  key: string,
  interpolations?: {+[string]: string | number}
) => string;

export type OptionalTranslateFnsType = {
  +translateKeys: (sources: any, locale: any, keys: string[]) => TranslationsObjectType[],
  +translateKey: (sources: any, locale: any, key: string) => string
}

export type I18nDepsType = {
  fetch?: typeof FetchToken.optional,
  hydrationState?: typeof HydrationStateToken.optional,
  loader?: typeof I18nLoaderToken.optional,
  events?: typeof UniversalEventsToken.optional,
  translateFns?: typeof I18nLoaderToken.optional,
};

export type IEmitter = $Call<ExtractReturnType, typeof UniversalEventsToken>;

export type I18nServiceType = {
  from: (
    ctx: Context
  ) => {
    +locale?: string | Locale,
    +translations?: TranslationsObjectType,
    +load: (Array<string>) => Promise<void>,
    +translate: TranslateFuncType,
    +translateFns?: OptionalTranslateFnsType,
  },
};
