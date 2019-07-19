// @flow

import test from 'tape-cup';
import App from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import ServiceWorker from '../index';
import {SWTemplateFunctionToken} from '../tokens';
import swTemplateFunction from './fixtures/swTemplate.js';

test('/health request', async t => {
  t.plan(2);
  const app = new App('el', el => el);
  app.register(SWTemplateFunctionToken, swTemplateFunction);
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  // Basic /health request
  const ctx_1 = await sim.request('/sw.js');
  t.equal(ctx_1.status, 200, 'sends 200 status on sw request');
  t.ok(
    String(ctx_1.body)
      .trim()
      .replace(/\n/g, '')
      .startsWith(`import {getHandlers} from '../../index'`),
    'sends correct response'
  );
  t.end();

  await app.cleanup();
});
