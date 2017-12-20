import {mockContext, renderContext} from './mock-context.js';
import simulate from './simulate';
import assert from 'assert';

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

// Export test runner functions from jest
let mockFunction, test;
if (typeof it !== 'undefined') {
  // Surface snapshot testing
  assert.matchSnapshot = tree => expect(tree).toMatchSnapshot();

  /* eslint-env node, jest */
  test = (description, callback, ...rest) =>
    it(description, () => callback(assert), ...rest);
  mockFunction = (...args) => jest.fn(...args);
} else {
  const notSupported = () => {
    throw new Error('Can’t import test() when not using the test-app target.');
  };
  test = notSupported;
  mockFunction = notSupported;
}
export {mockFunction, test};
