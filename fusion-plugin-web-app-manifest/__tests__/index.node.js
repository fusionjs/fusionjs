/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import React from 'react';
import {consumeSanitizedHTML} from 'fusion-core';

import Plugin from '../src/index.js';

const TEST_MANIFEST = {
  name: 'Fusion test manifest',
};

test('injects manifest', async done => {
  const element = React.createElement('div');
  const setupContext: any = {element, template: {head: [], body: []}};

  expect.assertions(1);
  if (!Plugin.middleware) {
    done();
    return;
  }

  // $FlowFixMe
  await Plugin.middleware({manifest: TEST_MANIFEST})(setupContext, () =>
    Promise.resolve()
  );
  const manifestLink = '<link rel="manifest" href="/manifest.json" />';
  expect(
    // $FlowFixMe
    consumeSanitizedHTML(setupContext.template.head[0]).match(manifestLink)[0]
  ).toBe(manifestLink);
  done();
});

test('returns manifest', async done => {
  const requestContext: any = {
    undefined,
    method: 'GET',
    path: '/manifest.json',
  };

  expect.assertions(1);
  if (!Plugin.middleware) {
    done();
    return;
  }
  // $FlowFixMe
  await Plugin.middleware({manifest: TEST_MANIFEST})(requestContext, () =>
    Promise.resolve()
  );
  // $FlowFixMe
  expect(requestContext.body).toBe(TEST_MANIFEST);
  done();
});
