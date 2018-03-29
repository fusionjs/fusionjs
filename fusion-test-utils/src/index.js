/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import assert from 'assert';

import FusionApp from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';

import {mockContext, renderContext} from './mock-context.js';
import simulate from './simulate';

declare var __BROWSER__: boolean;

const request = (app: FusionApp) => (
  url: string,
  options: * = {}
): Promise<*> => {
  if (__BROWSER__) {
    throw new Error(
      '[fusion-test-utils] Request api not support from the browser. Please use `render` instead'
    );
  }
  const ctx = mockContext(url, options);
  return simulate(app, ctx);
};

const render = (app: FusionApp) => (
  url: string,
  options: * = {}
): Promise<*> => {
  const ctx = renderContext(url, options);
  return simulate(app, ctx);
};

export function getSimulator(app: FusionApp, testPlugin?: FusionPlugin<*, *>) {
  if (testPlugin) {
    app.register(testPlugin);
  }
  app.resolve();

  return {
    request: request(app),
    render: render(app),
  };
}

// Export test runner functions from jest
// eslint-disable-next-line import/no-mutable-exports
let mockFunction, test;
// $FlowFixMe
if (typeof it !== 'undefined') {
  // Surface snapshot testing
  // $FlowFixMe
  assert.matchSnapshot = tree => expect(tree).toMatchSnapshot();

  /* eslint-env node, jest */
  // $FlowFixMe
  test = (description, callback, ...rest) =>
    it(description, () => callback(assert), ...rest);
  // $FlowFixMe
  mockFunction = (...args) => jest.fn(...args);
} else {
  const notSupported = () => {
    throw new Error('Can’t import test() when not using the test-app target.');
  };
  test = notSupported;
  mockFunction = notSupported;
}
export {mockFunction, test};
