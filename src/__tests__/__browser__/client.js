/* eslint-env browser */

import test from 'tape-cup';
import React from 'react';
import render from '../../client';
import App from '../../index';
import {render as run} from 'fusion-test-utils';

test('renders', t => {
  const root = setup();

  render(React.createElement('span', null, 'hello'));
  t.equals(root.firstChild.nodeName, 'SPAN', 'has right tag');
  t.equals(root.firstChild.textContent, 'hello', 'has right text');

  cleanup(root);
  t.end();
});

test('client side app', async t => {
  const root = setup();

  const app = new App(React.createElement('span', null, 'hello'));
  try {
    const ctx = await run(app, '/');
    t.ok(ctx.rendered, 'sets rendered');
    t.ok(ctx.element, 'sets element');
    t.equals(root.firstChild.nodeName, 'SPAN', 'has right tag');
    t.equals(root.firstChild.textContent, 'hello', 'has right text');
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
  document.body.appendChild(root);
  return root;
}

function cleanup(root) {
  document.body.removeChild(root);
}
