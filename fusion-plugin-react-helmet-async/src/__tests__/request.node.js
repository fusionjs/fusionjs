import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import test from 'tape-cup';
import HelmetPlugin from '../index.js';

test('Non render request', async t => {
  const app = new App('test', el => el);
  app.register(HelmetPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.request('/');
  t.equal(ctx.element, null, 'does not wrap ctx.element');
  t.end();
});
