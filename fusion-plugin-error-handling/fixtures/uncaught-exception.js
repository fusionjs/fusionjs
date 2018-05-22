/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
const App = require('fusion-core').default;
// eslint-disable-next-line import/no-unresolved
// $FlowFixMe
const {default: Plugin, ErrorHandlerToken} = require('../dist/index.js');

const onError = e => {
  console.log('ERROR HANDLER', e); // eslint-disable-line
};

const app = new App('el', el => el);

app.register(Plugin);
app.register(ErrorHandlerToken, onError);
app.resolve();

// keep the process running
setInterval(() => {}, 1000);

throw new Error('FAIL');
