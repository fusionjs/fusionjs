// @flow

import App from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import ServiceWorker from '../src/index';
import {LoggerToken} from 'fusion-tokens';
import {SWTemplateFunctionToken} from '../src/tokens';
import type {AssetInfo} from '../src/types';

const swTemplateFunction = (params: AssetInfo) => {
  return `
    import {getHandlers} from '../../index';
    var sw = (assetInfo: mixed) => {
    const {onFetch, onInstall} = getHandlers(assetInfo);
    self.addEventListener('install', onInstall);
    self.addEventListener('fetch', onFetch);
    return sw(${JSON.stringify(params)})`;
};

const createMockLogger = () => ({
  log: () => createMockLogger(),
  error: () => createMockLogger(),
  warn: () => createMockLogger(),
  info: () => createMockLogger(),
  verbose: () => createMockLogger(),
  debug: () => createMockLogger(),
  silly: () => createMockLogger(),
});

test('/health request', async () => {
  expect.assertions(2);
  const app = new App('el', el => el);
  app.register(SWTemplateFunctionToken, swTemplateFunction);
  app.register(LoggerToken, createMockLogger());
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  // Basic /health request
  const ctx_1 = await sim.request('/sw.js');
  expect(ctx_1.status).toBe(200);
  expect(
    String(ctx_1.body)
      .trim()
      .replace(/\n/g, '')
      .startsWith(`import {getHandlers} from '../../index'`)
  ).toBeTruthy();

  await app.cleanup();
});
