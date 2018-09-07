/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';

import type {I18nLoaderType} from './loader.js';

export const I18nLoaderToken: Token<I18nLoaderType> = createToken(
  'I18nLoaderToken'
);
