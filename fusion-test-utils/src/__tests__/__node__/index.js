import test from 'tape-cup';
import App from 'fusion-core';

import {mockContext} from '../../index.js';

test('simulate browser request', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);
  let ctx = mockContext.browser();
  await app.simulate(ctx);
  t.ok(flags.render, 'triggered ssr');
  t.end();
});

test('simulate non-browser request', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);
  let ctx = mockContext();
  await app.simulate(ctx);
  t.ok(!flags.render, 'did not trigger ssr');
  t.end();
});
