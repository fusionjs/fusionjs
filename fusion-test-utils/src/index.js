import {mockContext, renderContext} from './mock-context.js';
import simulate from './simulate';

export function request(app, url, options = {}) {
  if (__BROWSER__) {
    throw new Error(
      '[fusion-test-utils] Request api not support from the browser. Please use `render` instead'
    );
  }
  const ctx = mockContext(url, options);
  return simulate(app, ctx);
}

export function render(app, url, options = {}) {
  const ctx = renderContext(url, options);
  return simulate(app, ctx);
}
