/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/// <reference types="@types/jest" />

import assert from 'assert';

import FusionApp, {createToken, createPlugin} from 'fusion-core';
import type {FusionPlugin, Token} from 'fusion-core';

import {render, request} from './simulate';

// eslint-disable-next-line jest/no-export
export {createRequestContext, createRenderContext} from './mock-context';

// eslint-disable-next-line jest/no-export
export type Simulator = {
  request: ReturnType<typeof request>;
  render: ReturnType<typeof render>;
  getService<T>(token: Token<T>): T;
};
// eslint-disable-next-line jest/no-export
export function getSimulator(
  app: FusionApp,
  testPlugin?: FusionPlugin<any, any>
): Simulator {
  if (testPlugin) {
    app.register(testPlugin);
  }
  app.resolve();

  return {
    request: request(app),
    render: render(app),
    // $FlowFixMe
    getService: (token) => app.getService(token),
  };
}

// eslint-disable-next-line jest/no-export
export function getService<TService>(
  appCreator: () => FusionApp,
  plugin: FusionPlugin<any, TService>
): TService {
  const app = appCreator();
  const token: Token<TService> = createToken('service-helper');

  let extractedService = null;
  app.register(token, plugin);
  app.register(
    createPlugin({
      deps: {service: token},
      provides: ({service}) => {
        extractedService = service;
      },
    })
  );
  app.resolve();

  if (!extractedService) {
    throw new Error('Provided plugin does not export a service');
  }

  return extractedService;
}

type JestFnType = typeof jest.fn;

type MatchSnapshotType = (tree: unknown, snapshotName?: string | null) => void;

type CallableAssertType = (
  assertArg: typeof assert & {
    matchSnapshot: MatchSnapshotType;
  }
) => void | Promise<void>;

type TestType = (
  name: string,
  assert: CallableAssertType,
  timeout?: number
) => void;

// eslint-disable-next-line import/no-mutable-exports
let mockFunction: JestFnType, test: any;
if (typeof it !== 'undefined') {
  // Surface snapshot testing
  // @ts-expect-error
  assert.matchSnapshot = (
    tree,
    snapshotName // For some reason jest@25 fails when snapshotName=undefined is passed
  ) =>
    snapshotName
      ? expect(tree).toMatchSnapshot(snapshotName)
      : expect(tree).toMatchSnapshot();

  /* eslint-env node, jest */
  test = (description, callback, ...rest) =>
    it(description, () => callback(assert), ...rest);
  test.skip = (description, callback, ...rest) =>
    it.skip(description, () => callback(assert), ...rest);
  mockFunction = (...args) => jest.fn(...args);
} else {
  const notSupported = () => {
    throw new Error('Can’t import test() when not using the test-app target.');
  };
  test = notSupported;
  test.skip = notSupported;
  mockFunction = notSupported;
}

const mockFunctionExport = mockFunction;
const testExport = test as any as TestType;

// eslint-disable-next-line jest/no-export
export {mockFunctionExport as mockFunction, testExport as test};
