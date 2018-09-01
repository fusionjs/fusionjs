/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import {unescape, createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import type {Fetch} from 'fusion-tokens';

import {
  verifyMethod,
  verifyExpiry,
  CsrfExpireToken,
  FetchForCsrfToken,
} from './shared';
import type {CsrfDepsType, CsrfServiceType} from './flow.js';

const plugin =
  __BROWSER__ &&
  createPlugin({
    deps: {
      fetch: FetchForCsrfToken,
      expire: CsrfExpireToken.optional,
    },
    provides: ({fetch, expire = 86400}) => {
      const prefix = window.__ROUTE_PREFIX__ || ''; // created by fusion-core/src/server
      const tokenElement = document.getElementById('__CSRF_TOKEN__');

      let token = tokenElement
        ? JSON.parse(unescape(tokenElement.textContent))
        : '';

      let fetchWithCsrfToken: Fetch = (url, options) => {
        if (!options) options = {};
        // $FlowFixMe
        const isCsrfMethod = verifyMethod(options.method || 'GET');
        const isValid = verifyExpiry(String(token), expire);
        const isTokenRequired = !isValid || !token;
        if (isCsrfMethod && isTokenRequired) {
          // TODO(#3) don't append prefix if injected fetch also injects prefix
          return fetch(prefix + '/csrf-token', {
            method: 'POST',
            credentials: 'same-origin',
          }).then(r => {
            token = r.headers.get('x-csrf-token');
            return request();
          });
        } else {
          return request();
        }

        function request() {
          // $FlowFixMe
          return fetch(prefix + url, {
            ...options,
            credentials: 'same-origin',
            headers: {
              ...((options && options.headers) || {}),
              'x-csrf-token': token,
            },
          });
        }
      };
      return fetchWithCsrfToken;
    },
  });

export default ((plugin: any): FusionPlugin<CsrfDepsType, CsrfServiceType>);
