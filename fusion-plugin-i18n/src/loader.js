/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {Locale, Locales} from 'locale';
import fs from 'fs';
import path from 'path';

import {memoize} from 'fusion-core';
import type {Context} from 'fusion-core';

import type {TranslationsObjectType} from './types.js';

export type I18nLoaderType = {
  from: (
    ctx: Context
  ) => {locale: string | Locale, translations: TranslationsObjectType},
};
export type LocaleResolverType = (ctx: Context) => string;
export type LoaderFactoryType = (
  resolveLocales?: LocaleResolverType
) => I18nLoaderType;

const defaultResolveLocales: LocaleResolverType = ctx =>
  ctx.headers['accept-language'];

const loader: LoaderFactoryType = (resolveLocales = defaultResolveLocales) => {
  const readDir = root => {
    try {
      return fs.readdirSync(root);
    } catch (e) {
      return [];
    }
  };
  const root = './translations';
  const locales = readDir(root)
    .filter(p => p.match(/json$/))
    .map(p => p.replace(/\.json$/, ''));
  const data = locales.reduce((memo, locale) => {
    const parsedLocale = new Locale(locale);
    memo[parsedLocale.normalized] = JSON.parse(
      fs.readFileSync(path.join(root, locale + '.json'), 'utf8')
    );
    return memo;
  }, {});
  const supportedLocales = new Locales(locales);

  return {
    from: memoize(ctx => {
      const expectedLocales = new Locales(resolveLocales(ctx));
      const locale = expectedLocales.best(supportedLocales);
      const translations: TranslationsObjectType = data[locale.normalized];
      return {translations, locale};
    }),
  };
};

export default (((__NODE__ ? loader : null): any): typeof loader);
