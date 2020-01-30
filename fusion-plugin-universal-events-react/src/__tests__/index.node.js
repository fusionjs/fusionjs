/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import App from 'fusion-react';
import {getSimulator} from 'fusion-test-utils';
import plugin, {withBatchEvents, UniversalEventsToken} from '../index.js';

test('test plugin', async () => {
  let called = false;
  const Root = withBatchEvents(props => {
    const {universalEvents} = props;
    expect(typeof universalEvents.on).toBe('function');
    expect(typeof universalEvents.emit).toBe('function');
    universalEvents.emit('test', {hello: 'world'});
    return React.createElement('div', null, 'Hello World');
  });
  const app = new App(React.createElement(Root));
  app.register(UniversalEventsToken, plugin);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    events.on('test', p => {
      expect(p).toStrictEqual({hello: 'world'});
      called = true;
    });
    return (ctx, next) => {
      return next();
    };
  });
  const sim = getSimulator(app);
  await sim.render('/');
  expect(called).toBeTruthy();
});
