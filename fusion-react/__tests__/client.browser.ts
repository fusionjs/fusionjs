/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import * as React from 'react';
import render from '../src/client';

test('renders', (done) => {
  const root = setup(true);

  render(React.createElement('span', null, 'hello'));
  // setTimeout from https://github.com/reactwg/react-18/discussions/5#discussioncomment-796012
  setTimeout(() => {
    expect(root.firstChild).toBeTruthy();
    const firstChild = ((root.firstChild: any): Node);
    expect(firstChild.nodeName).toBe('SPAN');
    expect(firstChild.textContent).toBe('hello');
    cleanup(root);
    done();
  }, 0);
});

function setup(withSSRFailure) {
  const root = document.createElement('div');
  root.id = 'root';
  if (withSSRFailure) {
    root.setAttribute('data-fusion-render', 'client');
  }
  document.body && document.body.appendChild(root);
  return root;
}

function cleanup(root) {
  document.body && document.body.removeChild(root);
}
