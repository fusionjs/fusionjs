/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin, createToken, getEnv} from '../../src/index.js';
import {html, consumeSanitizedHTML} from '../../src/sanitization';
import BaseApp from '../../src/base-app';

import type {Context, FusionPlugin, Middleware, Token} from '../types.js';

/* eslint-disable no-unused-vars */

/*
 *  This file contains basic sanity code that tests the on-side of different
 *  parts of the module Flow definitions. Types are defined inline in source.
 */

/* Sanity Check: FusionPlugin<Deps, Service> */
const someApp: BaseApp = (null: any);
function optionallyRegistersAPlugin(
  app: BaseApp,
  somePlugin?: FusionPlugin<any, any>
): void {
  if (somePlugin) {
    app.register(somePlugin);
  }
}

const middlewareOnlyPlugin = createPlugin({
  middleware: () => (ctx, next) => {
    return next();
  },
});
(middlewareOnlyPlugin: FusionPlugin<empty, empty>);
optionallyRegistersAPlugin(someApp, middlewareOnlyPlugin);

const emptyPlugin = createPlugin({});
(emptyPlugin: FusionPlugin<*, *>);
(emptyPlugin: FusionPlugin<empty, empty>);
(emptyPlugin: FusionPlugin<any, any>);
optionallyRegistersAPlugin(someApp, emptyPlugin);

const emptyDepsPlugin = createPlugin({
  provides: () => {
    return;
  },
});
(emptyDepsPlugin: FusionPlugin<empty, void>);
optionallyRegistersAPlugin(someApp, emptyDepsPlugin);

const sampleStringToken: Token<string> = createToken('string-token');
const singleDepPlugin = createPlugin({
  deps: {str: sampleStringToken},
  provides: ({str}: {str: string}) => {
    return str;
  },
});
(singleDepPlugin: FusionPlugin<*, *>);
(singleDepPlugin: FusionPlugin<any, any>);
(singleDepPlugin: FusionPlugin<*, string>);
(singleDepPlugin: FusionPlugin<any, string>);
(singleDepPlugin: FusionPlugin<{str: Token<string>}, string>);
optionallyRegistersAPlugin(someApp, singleDepPlugin);

type SimplePluginDepsType = {
  str: Token<string>,
};
type SimplePluginServiceType = string;
const simplePlugin = createPlugin({
  deps: ({str: sampleStringToken}: SimplePluginDepsType),
  provides: ({str}: {str: string}) => {
    return str;
  },
  middleware: (deps: {str: string}, service: SimplePluginServiceType) => async (
    ctx,
    next
  ) => {
    return;
  },
});

/* Sanity Check: Middleware */
/*   - Case: Extract and invoke a dependency-less and service-less middleware */
const simpleMiddleware: Middleware = async (
  ctx: Context,
  next: () => Promise<void>
) => {};

const noDepsWithSimpleMiddlewarePlugin = createPlugin({
  middleware: () => simpleMiddleware,
});
const extractedEmptyMiddleware = noDepsWithSimpleMiddlewarePlugin.middleware;
if (extractedEmptyMiddleware) {
  /* refine to remove 'void' */
  extractedEmptyMiddleware(); // no deps
}

/*   - Case: Extract and invoke a service-less middleware */
const noServiceWithSimpleMiddlewarePlugin = createPlugin({
  deps: ({str: sampleStringToken}: SimplePluginDepsType),
  middleware: deps => simpleMiddleware,
});
const extractedServicelessMiddleware =
  noServiceWithSimpleMiddlewarePlugin.middleware;
if (extractedServicelessMiddleware) {
  extractedServicelessMiddleware({str: 'hello'}); // no service
}

/*   - Case: Extract and invoke a full middleware */
const extractedFullMiddleware = simplePlugin.middleware;
if (extractedFullMiddleware) {
  extractedFullMiddleware({str: 'hello'}, 'service');
}

/*   - Case: Cleanup should be covered */
async function cleanup() {
  await someApp.cleanup();
}

/*   - Case: getEnv typing */
async function checkEnv() {
  const {
    rootDir,
    env,
    prefix,
    assetPath,
    baseAssetPath,
    cdnUrl,
    webpackPublicPath,
  } = getEnv();
  return {
    rootDir,
    env,
    prefix,
    assetPath,
    baseAssetPath,
    cdnUrl,
    webpackPublicPath,
  };
}

/*   - Case: sanitization typing */
const sanitizedString = html`
  mystring
`;
consumeSanitizedHTML(sanitizedString);
