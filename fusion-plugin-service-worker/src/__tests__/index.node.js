import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';
import ServiceWorker from '../index';

test('/health request', async t => {
  const app = new App('el', el => el);
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  // Basic /health request
  const ctx_1 = await sim.request('/sw.js');
  t.equal(ctx_1.status, 200, 'sends 200 status on sw request');
  t.equal(ctx_1.body, 'OK', 'sends OK response body');
  t.end();

  await app.cleanup();
});
