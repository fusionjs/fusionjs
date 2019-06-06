/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import {FetchToken} from 'fusion-tokens';
import {createPlugin, unescape, createToken} from 'fusion-core';
import type {FusionPlugin, Token} from 'fusion-core';

import type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
} from './types.js';

type LoadedTranslationsType = {
  localeCode?: string,
  translations?: TranslationsObjectType,
};
function loadTranslations(): LoadedTranslationsType {
  const element = document.getElementById('__TRANSLATIONS__');
  if (!element) {
    throw new Error(
      '[fusion-plugin-i18n] - Could not find a __TRANSLATIONS__ element'
    );
  }
  try {
    return JSON.parse(unescape(element.textContent));
  } catch (e) {
    throw new Error(
      '[fusion-plugin-i18n] - Error parsing __TRANSLATIONS__ element content'
    );
  }
}

type HydrationStateType = {
  localeCode?: string,
  translations: TranslationsObjectType,
};
export const HydrationStateToken: Token<HydrationStateType> = createToken(
  'HydrationStateToken'
);

type PluginType = FusionPlugin<I18nDepsType, I18nServiceType>;
const pluginFactory: () => PluginType = () =>
  createPlugin({
    deps: {
      fetch: FetchToken.optional,
      hydrationState: HydrationStateToken.optional,
    },
    provides: ({fetch = window.fetch, hydrationState} = {}) => {
      class I18n {
        localeCode: ?string;
        translations: TranslationsObjectType;
        requestedKeys: Set<string>;

        constructor() {
          const {localeCode, translations} =
            hydrationState || loadTranslations();
          this.requestedKeys = new Set();
          this.localeCode = localeCode;
          this.translations = translations || {};
        }
        async load(translationKeys) {
          const loadedKeys = Object.keys(this.translations);
          const unloaded = translationKeys.filter(key => {
            return loadedKeys.indexOf(key) < 0 && !this.requestedKeys.has(key);
          });
          const fetchOpts = {
            method: 'POST',
            headers: {
              Accept: '*/*',
              ...(this.localeCode
                ? {'X-Fusion-Locale-Code': this.localeCode}
                : {}),
            },
          };
          if (unloaded.length > 0) {
            // Don't try to load translations again if a request is already in
            // flight. This means that we need to add unloaded chunks to
            // loadedChunks optimistically and remove them if some error happens
            unloaded.forEach(key => {
              this.requestedKeys.add(key);
            });
            const keys = unloaded.join(',');
            // TODO(#3) don't append prefix if injected fetch also injects prefix
            return fetch(`/_translations?keys=${keys}`, fetchOpts)
              .then(r => r.json())
              .then((data: {[string]: string}) => {
                for (const key in data) {
                  this.translations[key] = data[key];
                  this.requestedKeys.delete(key);
                }
              })
              .catch((err: Error) => {
                // An error occurred, so remove the chunks we were trying to load
                // from loadedChunks. This allows us to try to load those chunk
                // translations again
                unloaded.forEach(key => {
                  this.requestedKeys.delete(key);
                });
                throw err;
              });
          }
        }
        translate(key: string, interpolations: TranslationsObjectType = {}) {
          const template = this.translations[key];
          return template
            ? template.replace(/\${(.*?)}/g, (_, k) =>
                interpolations[k] === void 0
                  ? '${' + k + '}'
                  : interpolations[k]
              )
            : key;
        }
      }
      const i18n = new I18n();
      return {from: () => i18n};
    },
  });

export default ((__BROWSER__ && pluginFactory(): any): PluginType);
