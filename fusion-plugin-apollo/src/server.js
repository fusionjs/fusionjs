/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import {renderToStringWithData} from 'react-apollo';

import type {Element} from 'react';

export default (root: Element<*>) => {
  return renderToStringWithData(root).then(content => {
    return `<div id='root'>${content}</div>`;
  });
};
