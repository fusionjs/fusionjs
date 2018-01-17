import test from 'tape-cup';
import React from 'react';
import {getSimulator} from 'fusion-test-utils';
import App from '../index';

test('custom render function', async t => {
  let didRender = false;
  const app = new App(React.createElement('span', null, 'hello'), () => {
    didRender = true;
    return 10;
  });
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.ok(ctx.element);
  t.equal(ctx.rendered, 10);
  t.ok(didRender);
  t.end();
});
