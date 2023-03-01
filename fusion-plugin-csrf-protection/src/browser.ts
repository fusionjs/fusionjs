/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */
import type {Fetch} from 'fusion-tokens';
import {verifyMethod} from './shared';

declare global {
  // https://github.com/uber/fusionjs/issues/1577
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __ROUTE_PREFIX__?: string;
  }
}
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
        // $FlowFixMe
        ...((options && options.headers) || {}),
        'x-csrf-token': 'x',
      },
    });
  };
  return fetchWithCsrfToken;
};

export default enhancer;
