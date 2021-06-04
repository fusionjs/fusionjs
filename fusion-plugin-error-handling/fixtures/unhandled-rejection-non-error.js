/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
const App = require('fusion-core').default;

const {default: Plugin, ErrorHandlerToken} = require('..');

const onError = (e) => {
  console.log('ERROR HANDLER', e); // eslint-disable-line
  console.log('INSTANCEOF ERROR', e instanceof Error); // eslint-disable-line
};

const app = new App('el', (el) => el);

app.register(Plugin);
app.register(ErrorHandlerToken, onError);
app.resolve();

// keep the process running
setInterval(() => {}, 1000);

Promise.reject('foobar');
