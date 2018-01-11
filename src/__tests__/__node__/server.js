import test from 'tape-cup';
import React from 'react';
import render from '../../server';
import App from '../../index';
import {render as run} from 'fusion-test-utils';

test('renders', t => {
  const rendered = render(React.createElement('span', null, 'hello'));
  t.ok(/<span/.test(rendered), 'has right tag');
  t.ok(/hello/.test(rendered), 'has right text');
  t.end();
});

test('app api', async t => {
  t.equal(typeof App, 'function', 'exports a function');
  try {
    const app = new App(React.createElement('div', null, 'Hello World'));
    const ctx = await run(app, '/');
    t.ok(ctx.rendered.includes('Hello World'));
    t.ok(ctx.body.includes(ctx.rendered));
  } catch (e) {
    t.ifError(e);
  } finally {
    t.end();
  }
});
