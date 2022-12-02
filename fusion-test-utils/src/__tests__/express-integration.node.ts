/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import App from 'fusion-core';
import HttpHandlerPlugin, {HttpHandlerToken} from 'fusion-plugin-http-handler';
import express from 'express';

import {getSimulator} from '../index';

test('integrate with express', (done) => {
  const flags = {render: false, end: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  app.register(HttpHandlerPlugin);
  const expressApp = express();

  expressApp.get('/', (req, res) => {
    res.on('end', () => {
      flags.end = true;
    });
    res.send('OK').end();
  });
  app.register(HttpHandlerToken, expressApp);

  const testApp = getSimulator(app);

  if (!__BROWSER__) {
    testApp.request('/').then((ctx) => {
      expect(ctx.element).toBeFalsy();
      expect(!flags.render).toBeTruthy();
      expect(flags.end).toBeTruthy();

      done();
    });
  }
});
