// @flow

import {createPlugin, createToken} from '../../src/index.js';

/* eslint-disable no-unused-vars */

/*
 *  This file contains basic sanity code that tests the on-side of different
 *  parts of the module Flow definitions.  See src/flow.js for more details.
 */

const someApp: FusionApp = (null: any);
function optionallyRegistersAPlugin(
  app: FusionApp,
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
(middlewareOnlyPlugin: FusionPlugin<void, void>);
optionallyRegistersAPlugin(someApp, middlewareOnlyPlugin);

const emptyPlugin = createPlugin({});
(emptyPlugin: FusionPlugin<*, *>);
(emptyPlugin: FusionPlugin<void, void>);
(emptyPlugin: FusionPlugin<any, any>);
optionallyRegistersAPlugin(someApp, emptyPlugin);

const emptyDepsPlugin = createPlugin({
  provides: () => {
    return;
  },
});
(emptyDepsPlugin: FusionPlugin<void, void>);
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
