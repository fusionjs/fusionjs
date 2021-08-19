/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {Context, Token, FusionPlugin} from 'fusion-core';
import {Locale} from 'locale';
import {FetchToken} from 'fusion-tokens';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

declare const I18nLoaderToken: fusion_core.Token<any>;
declare const I18nTranslateFnsToken: fusion_core.Token<any>;

declare type TranslationsObjectType = {
  [x: string]: string;
};
declare type TranslateFuncType = (
  key: string,
  interpolations?: {
    readonly [x: string]: string | number;
  }
) => string;
declare type OptionalTranslateFnsType = {
  readonly translateKeys: (
    sources: any,
    locale: any,
    keys: (string | string[])[]
  ) => TranslationsObjectType;
  readonly translateKey: (sources: any, locale: any, key: string) => string;
};
declare type I18nDepsType = {
  fetch?: typeof FetchToken.optional;
  hydrationState?: typeof HydrationStateToken.optional;
  loader?: typeof I18nLoaderToken.optional;
  events?: typeof UniversalEventsToken.optional;
  translateFns?: typeof I18nLoaderToken.optional;
};

declare type I18nServiceType = {
  from: (ctx: Context) => {
    readonly locale?: string | Locale;
    readonly translations?: TranslationsObjectType;
    readonly load: (a: Array<string>) => Promise<void>;
    readonly translate: TranslateFuncType;
    readonly translateFns?: OptionalTranslateFnsType;
  };
};

declare type HydrationStateType = {
  localeCode?: string;
  translations: TranslationsObjectType;
};
declare const HydrationStateToken: Token<HydrationStateType>;

declare type I18nLoaderType = {
  from: (ctx: Context) => {
    locale: string | Locale;
    translations: TranslationsObjectType;
  };
};
declare type LocaleResolverType = (ctx: Context) => string;
declare type LoaderFactoryType = (
  resolveLocales?: LocaleResolverType
) => I18nLoaderType;
declare const _default: LoaderFactoryType;

declare const I18nToken: Token<I18nServiceType>;
declare const plugin: FusionPlugin<I18nDepsType, I18nServiceType>;
declare const createI18nLoader: typeof _default;
declare const matchesLiteralSections: any;

export {
  HydrationStateToken,
  I18nDepsType,
  I18nLoaderToken,
  I18nServiceType,
  I18nToken,
  I18nTranslateFnsToken,
  TranslateFuncType,
  TranslationsObjectType,
  createI18nLoader,
  plugin as default,
  matchesLiteralSections,
};
