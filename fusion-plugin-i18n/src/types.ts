/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Locale } from "locale";

import { FetchToken } from "fusion-tokens";
import type { Context } from "fusion-core";
import { UniversalEventsToken } from "fusion-plugin-universal-events";

import { HydrationStateToken } from "./browser";
import { I18nLoaderToken } from "./tokens";

type $Call1<F extends (...args: any) => any, A> = F extends (
  a: A,
  ...args: any
) => infer R
  ? R
  : never;

export type TranslationsObjectType = {
  [x: string]: string;
};

type ExtractReturnType = <V>(a: () => V) => V;

export type TranslateFuncType = (
  key: string,
  interpolations?: {
    readonly [x: string]: string | number;
  }
) => string;

export type OptionalTranslateFnsType = {
  readonly translateKeys: (
    sources: any,
    locale: any,
    keys: (string | string[])[]
  ) => TranslationsObjectType;
  readonly translateKey: (sources: any, locale: any, key: string) => string;
};

export type I18nDepsType = {
  fetch?: typeof FetchToken.optional;
  hydrationState?: typeof HydrationStateToken.optional;
  loader?: typeof I18nLoaderToken.optional;
  events?: typeof UniversalEventsToken.optional;
  translateFns?: typeof I18nLoaderToken.optional;
};

export type IEmitter = $Call1<ExtractReturnType, typeof UniversalEventsToken>;

export type I18nServiceType = {
  from: (ctx: Context) => {
    readonly locale?: string | Locale;
    readonly translations?: TranslationsObjectType;
    readonly load: (a: Array<string>) => Promise<void>;
    readonly translate: TranslateFuncType;
    readonly translateFns?: OptionalTranslateFnsType;
  };
};

export type I18nLoaderType = {
  from: (ctx: Context) => {
    locale: string | Locale;
    translations: TranslationsObjectType;
  };
};
export type I18nLocaleResolverType = (ctx: Context) => string;
export type I18nLoaderFactoryType = (
  resolveLocales?: I18nLocaleResolverType
) => I18nLoaderType;
