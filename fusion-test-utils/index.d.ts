/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/// <reference types="@types/jest" />
/// <reference types="node" />
import assert from 'assert';
import FusionApp, {Context, Token, FusionPlugin} from 'fusion-core';

declare const request: (
  app: FusionApp
) => (url: string, options?: any) => Promise<any>;
declare const render: (
  app: FusionApp
) => (url: string, options?: any) => Promise<any>;

declare type ContextOptions = {
  headers?: {
    [key: string]: string;
  };
  body?: unknown;
  method?: string;
};
declare function createRequestContext(
  url: string,
  options?: ContextOptions
): Context;
declare function createRenderContext(
  url: string,
  options?: ContextOptions
): Context;

declare type Simulator = {
  request: ReturnType<typeof request>;
  render: ReturnType<typeof render>;
  getService<T>(token: Token<T>): T;
};
declare function getSimulator(
  app: FusionApp,
  testPlugin?: FusionPlugin<any, any>
): Simulator;
declare function getService<TService>(
  appCreator: () => FusionApp,
  plugin: FusionPlugin<any, TService>
): TService;
declare type MatchSnapshotType = (
  tree: unknown,
  snapshotName?: string | null
) => void;
declare type CallableAssertType = (
  assertArg: typeof assert & {
    matchSnapshot: MatchSnapshotType;
  }
) => void | Promise<void>;
declare type TestType = (
  name: string,
  assert: CallableAssertType,
  timeout?: number
) => void;
declare const mockFunctionExport: typeof jest.fn;
declare const testExport: TestType;

export {
  Simulator,
  createRenderContext,
  createRequestContext,
  getService,
  getSimulator,
  mockFunctionExport as mockFunction,
  testExport as test,
};
