/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fetch, Session} from 'fusion-tokens';
import type {Token} from 'fusion-core';

import {CsrfExpireToken, CsrfIgnoreRoutesToken} from './shared';

export type CsrfDepsType = {
  fetch?: Token<Fetch>,
  expire: typeof CsrfExpireToken.optional,
  Session?: Token<Session>,
  ignored?: typeof CsrfIgnoreRoutesToken.optional,
};

export type CsrfServiceType = Fetch;
