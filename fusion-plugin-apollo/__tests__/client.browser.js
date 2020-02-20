/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import React from 'react';
import render from '../src/client';

test('renders', () => {
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
  expect(firstChild.nodeName).toBe('SPAN');
  expect(firstChild.textContent).toBe('hello');

  if (!document.body) {
    throw new Error('Could not find body');
  }
  document.body.removeChild(root);
});
