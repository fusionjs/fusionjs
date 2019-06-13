/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import tape from 'tape-cup';
import React from 'react';
import {consumeSanitizedHTML} from 'fusion-core';

import Plugin from '../index.js';

const TEST_MANIFEST = {
  name: 'Fusion test manifest',
};

tape('injects manifest', async t => {
  const element = React.createElement('div');
  const setupContext: any = {element, template: {head: [], body: []}};

  t.plan(1);
  if (!Plugin.middleware) {
    t.end();
    return;
  }

  // $FlowFixMe
  await Plugin.middleware(TEST_MANIFEST)(setupContext, () => Promise.resolve());
  const manifestLink = '<link rel="manifest" href="/manifest.json" />';
  t.equals(
    // $FlowFixMe
    consumeSanitizedHTML(setupContext.template.head[0]).match(manifestLink)[0],
    manifestLink,
    'manifest link injected into head'
  );
  t.end();
});

tape('returns manifest', async t => {
  const requestContext: any = {
    undefined,
    method: 'GET',
    path: '/manifest.json',
  };

  t.plan(1);
  if (!Plugin.middleware) {
    t.end();
    return;
  }
  // $FlowFixMe
  await Plugin.middleware(TEST_MANIFEST)(requestContext, () =>
    Promise.resolve()
  );
  // $FlowFixMe
  t.equals(requestContext.body, TEST_MANIFEST, 'manifest object returned');
  t.end();
});
