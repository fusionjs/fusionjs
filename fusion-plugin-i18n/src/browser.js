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
  chunks?: Array<number | string>,
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
  chunks: Array<number | string>,
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
        loadedChunks: Array<number | string>;
        localeCode: ?string;
        translationMap: TranslationsObjectType;

        constructor() {
          const {chunks, localeCode, translations} =
            hydrationState || loadTranslations();
          this.loadedChunks = (chunks: Array<number | string> | void) || [];
          this.localeCode = localeCode;
          this.translationMap = translations || {};
        }
        async load(chunkIds: Array<number | string>): Promise<void> {
          const unloaded = chunkIds.filter(id => {
            return this.loadedChunks.indexOf(id) < 0;
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
            this.loadedChunks = [...this.loadedChunks, ...unloaded];

            const ids = unloaded.join(',');
            // TODO(#3) don't append prefix if injected fetch also injects prefix
            return fetch(`/_translations?ids=${ids}`, fetchOpts)
              .then(r => r.json())
              .then((data: {[string]: string}) => {
                for (const key in data) this.translationMap[key] = data[key];
              })
              .catch((err: Error) => {
                // An error occurred, so remove the chunks we were trying to load
                // from loadedChunks. This allows us to try to load those chunk
                // translations again
                this.loadedChunks = this.loadedChunks.filter(
                  chunk => unloaded.indexOf(chunk) === -1
                );
                throw err;
              });
          }
        }
        translate(key: string, interpolations: TranslationsObjectType = {}) {
          const template = this.translationMap[key];
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
