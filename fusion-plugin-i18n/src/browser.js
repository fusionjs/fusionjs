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

import type {I18nDepsType, I18nServiceType} from './flow.js';

function loadTranslations() {
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
  chunks: Array<number>,
  translations: Object,
};
export const HydrationStateToken: Token<HydrationStateType> = createToken(
  'HydrationStateToken'
);
const plugin =
  __BROWSER__ &&
  createPlugin({
    deps: {
      fetch: FetchToken.optional,
      hydrationState: HydrationStateToken.optional,
    },
    provides: ({fetch = window.fetch, hydrationState} = {}) => {
      class I18n {
        loadedChunks: any;
        translationMap: any;

        constructor() {
          const {chunks, translations} = hydrationState || loadTranslations();
          this.loadedChunks = chunks || [];
          this.translationMap = translations || {};
        }
        load(chunkIds) {
          const unloaded = chunkIds.filter(id => {
            return this.loadedChunks.indexOf(id) < 0;
          });
          if (unloaded.length > 0) {
            const ids = unloaded.join(',');
            // TODO(#3) don't append prefix if injected fetch also injects prefix
            return fetch(`/_translations?ids=${ids}`, {method: 'POST'})
              .then(r => r.json())
              .then(data => {
                for (const key in data) this.translationMap[key] = data[key];
                unloaded.forEach(id => {
                  this.loadedChunks[id] = true;
                });
              });
          }
        }
        translate(key, interpolations = {}) {
          const template = this.translationMap[key];
          return template
            ? template.replace(/\${(.*?)}/g, (_, k) => interpolations[k])
            : key;
        }
      }
      const i18n = new I18n();
      return {from: () => i18n};
    },
  });

export default ((plugin: any): FusionPlugin<I18nDepsType, I18nServiceType>);
