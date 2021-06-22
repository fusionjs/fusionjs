/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createToken} from 'fusion-core';

export const I18nLoaderToken = createToken<*>('I18nLoaderToken');

export const I18nTranslateFnsToken = createToken<*>('I18nTranslateFnsToken');
