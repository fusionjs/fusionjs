/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */

import * as React from 'react';
import render from '../client';

const TestComponent = () => {
  return <div>{Math.random()}</div>;
};

test('hydration mismatch triggers logger warning', (done) => {
  const root = setup();
  let didWarn = false;
  render(<TestComponent />, {
    // @ts-ignore
    warn: () => {
      didWarn = true;
    },
  });
  // setTimeout from https://github.com/reactwg/react-18/discussions/5#discussioncomment-796012
  setTimeout(() => {
    expect(didWarn).toEqual(true);
    cleanup(root);
    done();
  });
});

function setup() {
  const root = document.createElement('div');
  root.id = 'root';
  document.body && document.body.appendChild(root);
  return root;
}

function cleanup(root) {
  document.body && document.body.removeChild(root);
}
