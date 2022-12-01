/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import assert from "assert";

import FusionApp, { createToken, createPlugin } from "fusion-core";
import type { FusionPlugin, Token } from "fusion-core";

/* Note: as the Jest type definitions are declared globally and not as part of
 * a module, we must import the relevant types directly from the libdef file here
 * to avoid the invariant that all consumers must add the jest libdef to their
 * .flowconfig libs.
 */
import type { JestTestName, JestObjectType } from "./flow/jest_v22.x.x";
import { render, request } from "./simulate";

type $Call1<F extends (...args: any) => any, A> = F extends (
  a: A,
  ...args: any
) => infer R
  ? R
  : never;

// eslint-disable-next-line jest/no-export
export { createRequestContext, createRenderContext } from "./mock-context";

declare var __BROWSER__: boolean;
type ExtractFusionAppReturnType = <R>(a: (a: FusionApp) => R) => R;
// eslint-disable-next-line jest/no-export
export type Simulator = {
  request: $Call1<ExtractFusionAppReturnType, typeof request>;
  render: $Call1<ExtractFusionAppReturnType, typeof render>;
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
  const token: Token<TService> = createToken("service-helper");

  let extractedService = null;
  app.register(token, plugin);
  app.register(
    createPlugin({
      deps: { service: token },
      provides: ({ service }) => {
        extractedService = service;
      },
    })
  );
  app.resolve();

  if (!extractedService) {
    throw new Error("Provided plugin does not export a service");
  }

  return extractedService;
}

// Export test runner functions from jest
type ExtractArgsReturnType<TArguments, TReturn> = <R>(
  a: (implementation?: (...args: TArguments) => TReturn) => R
) => R;

type JestFnType = JestObjectType["fn"];

// eslint-disable-next-line flowtype/generic-spacing
type MockFunctionType<TArgs, TReturn> = (
  ...args: TArgs
) => $Call1<ExtractArgsReturnType<TArgs, TReturn>, JestFnType>;

type MatchSnapshotType = (tree: unknown, snapshotName?: string | null) => void;

type CallableAssertType = (
  assert: typeof assert & {
    matchSnapshot: MatchSnapshotType;
  }
) => void | Promise<void>;

type TestType = (
  name: JestTestName,
  assert: CallableAssertType,
  timeout?: number
) => void;

// eslint-disable-next-line import/no-mutable-exports
let mockFunction: MockFunctionType<any, any>, test: any;
if (typeof it !== "undefined") {
  // Surface snapshot testing
  // $FlowFixMe
  assert.matchSnapshot = (tree, snapshotName) =>
    // For some reason jest@25 fails when snapshotName=undefined is passed
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
    throw new Error("Can’t import test() when not using the test-app target.");
  };
  test = notSupported;
  test.skip = notSupported;
  mockFunction = notSupported;
}

const mockFunctionExport = mockFunction as any as MockFunctionType<any, any>;
const testExport = test as any as TestType;

// eslint-disable-next-line jest/no-export
export { mockFunctionExport as mockFunction, testExport as test };
