import test from 'tape-cup';
import App from 'fusion-core';

import {render, request} from '../index.js';

test('simulate render request', async t => {
  const flags = {render: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  const ctx = await render(app, '/');
  t.ok(flags.render, 'triggered ssr');
  t.ok(ctx.element, 'sets ctx.element');
  t.end();
});

test('simulate non-render request', async t => {
  const flags = {render: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  if (__BROWSER__) {
    try {
      await request(app, '/');
      t.fail('should have thrown');
    } catch (e) {
      t.ok(e, 'throws an error');
    } finally {
      t.end();
    }
  } else {
    const ctx = await request(app, '/');
    t.notok(ctx.element, 'does not set ctx.element');
    t.ok(!flags.render, 'did not trigger ssr');
    t.end();
  }
});
