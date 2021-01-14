/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import type {Fetch} from 'fusion-tokens';
import {verifyMethod} from './shared';

const enhancer = (fetch: Fetch) => {
  const prefix = window.__ROUTE_PREFIX__ || ''; // created by fusion-core/src/server
  let fetchWithCsrfToken: Fetch = (url, options) => {
    if (!options) options = {};
    const isCsrfMethod = verifyMethod(options.method || 'GET');
    if (!isCsrfMethod) {
      return fetch(prefix + String(url), options);
    }
    return fetch(prefix + String(url), {
      ...options,
      credentials: 'same-origin',
      headers: {
        ...((options && options.headers) || {}),
        'x-csrf-token': 'x',
      },
    });
  };
  return fetchWithCsrfToken;
};

export default enhancer;
