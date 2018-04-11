/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import test from 'tape-cup';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import plugin, {withBatchEvents, UniversalEventsToken} from '../index.js';

test('test plugin', async t => {
  let called = false;
  const Root = withBatchEvents(props => {
    const {universalEvents} = props;
    t.equal(typeof universalEvents.on, 'function');
    t.equal(typeof universalEvents.emit, 'function');
    universalEvents.emit('test', {hello: 'world'});
    return React.createElement('div', null, 'Hello World');
  });
  const app = new App(React.createElement(Root));
  app.register(UniversalEventsToken, plugin);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    events.on('test', p => {
      t.deepLooseEqual(p, {hello: 'world'});
      called = true;
    });
    return (ctx, next) => {
      return next();
    };
  });
  const sim = getSimulator(app);
  await sim.render('/');
  t.ok(called);
  t.end();
});
