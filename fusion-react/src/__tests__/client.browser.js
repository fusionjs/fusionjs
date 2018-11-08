/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import test from 'tape-cup';
import * as React from 'react';
import {getSimulator} from 'fusion-test-utils';
import render from '../client';
import App from '../index';

test('renders', t => {
  const root = setup();

  render(React.createElement('span', null, 'hello'));
  t.ok(root.firstChild);
  const firstChild = ((root.firstChild: any): Node);
  t.equals(firstChild.nodeName, 'SPAN', 'has right tag');
  t.equals(firstChild.textContent, 'hello', 'has right text');

  cleanup(root);
  t.end();
});

test('client side app', async t => {
  const root = setup();

  const app = new App(React.createElement('span', null, 'hello'));
  const simulator = getSimulator(app);
  try {
    const ctx = await simulator.render('/');
    t.ok(ctx.rendered, 'sets rendered');
    t.ok(ctx.element, 'sets element');
    t.ok(root.firstChild);
    const firstChild = ((root.firstChild: any): Node);
    t.equals(firstChild.nodeName, 'SPAN', 'has right tag');
    t.equals(firstChild.textContent, 'hello', 'has right text');
  } catch (e) {
    t.ifError(e);
  } finally {
    cleanup(root);
    t.end();
  }
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
