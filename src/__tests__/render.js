import test from 'tape-cup';
import App from '../index';
import React from 'react';
import {render} from 'fusion-test-utils';

test('custom render function', async t => {
  let didRender = false;
  const app = new App(React.createElement('span', null, 'hello'), () => {
    didRender = true;
    return 10;
  });
  const ctx = await render(app, '/');
  t.ok(ctx.element);
  t.equal(ctx.rendered, 10);
  t.ok(didRender);
  t.end();
});
