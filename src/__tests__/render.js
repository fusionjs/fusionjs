import test from 'tape-cup';
import App from '../index';
import React from 'react';

test('custom render function', async t => {
  let didRender = false;
  const app = new App(React.createElement('span', null, 'hello'), () => {
    didRender = true;
    return 10;
  });
  const initialCtx = __NODE__
    ? {
        path: '/',
        headers: {
          accept: 'text/html',
        },
      }
    : {};
  const ctx = await app.simulate(initialCtx);
  t.ok(ctx.element);
  t.equal(ctx.rendered, 10);
  t.ok(didRender);
  t.end();
});
