/**
 * Fixture to validate test() flow types.
 */
import App, {createToken} from 'fusion-core';
import type {Token} from 'fusion-core';
import {
  test,
  getSimulator,
  createRequestContext,
  createRenderContext,
} from '../../index';

test('Some content', async (assert) => {
  const app = new App('el', (el) => el);
  const TokenA: Token<string> = createToken('A');
  app.register(TokenA, 'test');
  const simulator = getSimulator(app);
  const a: string = simulator.getService(TokenA);
  assert.equal(a, 'test');
  createRequestContext('/');
  createRenderContext('/');
  createRequestContext('/', {
    headers: {
      test: 'test',
    },
    body: 'test',
    method: 'POST',
  });
});
