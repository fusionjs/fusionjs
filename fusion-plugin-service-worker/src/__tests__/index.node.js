// @flow
import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';
import ServiceWorker from '../index';
import {SWTemplateFunctionToken} from '../tokens';
import swTemplateFunction from './fixtures/swTemplate.js';

test('/health request', async t => {
  const app = new App('el', el => el);
  app.register(SWTemplateFunctionToken, swTemplateFunction);
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  // Basic /health request
  const ctx_1 = await sim.request('/sw.js');
  t.equal(ctx_1.status, 200, 'sends 200 status on sw request');
  t.ok(
    String(ctx_1.body)
      .replace(/\n/g, '')
      .startsWith(`var sw = (assetInfo: AssetInfo) => {`),
    'sends correct response'
  );
  t.end();

  await app.cleanup();
});
