/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

import test from 'tape-cup';
import React from 'react';
import render from '../client';

test('renders', t => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  render(React.createElement('span', null, 'hello'));
  t.equals(root.firstChild.nodeName, 'SPAN', 'has right tag');
  t.equals(root.firstChild.textContent, 'hello', 'has right text');
  document.body.removeChild(root);
  t.end();
});
