/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {FetchToken} from 'fusion-tokens';
import type {Context} from 'fusion-core';

import {HydrationStateToken} from './browser';

export type I18nDepsType = {
  fetch?: typeof FetchToken.optional,
  hydrationState?: typeof HydrationStateToken.optional,
};

export type I18nServiceType = {
  from: (
    ctx?: Context
  ) => {
    locale?: string,
    load: (chunkIds: Array<number>) => Promise<*>,
    translate: (key: string, interpolations?: Object) => string,
  },
};
