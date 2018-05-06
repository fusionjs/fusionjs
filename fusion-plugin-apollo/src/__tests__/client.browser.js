/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import test from 'tape-cup';
import React from 'react';
import render from '../client';

test('renders', t => {
  const root = document.createElement('div');
  root.id = 'root';
  if (!document.body) {
    throw new Error('Could not find body');
  }
  document.body.appendChild(root);
  render(React.createElement('span', null, 'hello'));
  const firstChild = root.firstChild;
  if (!firstChild) {
    throw new Error('Could not first child');
  }
  t.equals(firstChild.nodeName, 'SPAN', 'has right tag');
  t.equals(firstChild.textContent, 'hello', 'has right text');

  if (!document.body) {
    throw new Error('Could not find body');
  }
  document.body.removeChild(root);
  t.end();
});
