/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Locale, Locales} from 'locale';
import {memoize} from 'fusion-core';
import fs from 'fs';
import path from 'path';

export default (__NODE__
  ? () => {
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
          const expectedLocales = new Locales(ctx.headers['accept-language']);
          const locale = expectedLocales.best(supportedLocales);
          const translations = data[locale.normalized];
          return {translations, locale};
        }),
      };
    }
  : null);
