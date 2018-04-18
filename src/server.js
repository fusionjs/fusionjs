/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import * as React from 'react';
import {renderToString} from 'react-dom/server';

export default (el: React.Element<*>) =>
  `<div id='root'>${renderToString(el)}</div>`;
