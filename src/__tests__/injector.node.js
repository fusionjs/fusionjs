/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import React from 'react';
import FusionApp, {createPlugin, createToken} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import App, {withServices} from '../index';

tape('inject services', async t => {
  const HelloToken = createToken('hola');
  const HelloPlugin = createPlugin({
    provides() {
      return 'world';
    },
  });

  const GoodbyeToken = createToken('adios');
  const GoodbyePlugin = createPlugin({
    provides() {
      return 'moon';
    },
  });

  function TestComponent({hi, bye}) {
    t.equal(hi, 'world');
    t.equal(bye, 'moon');

    return (
      <div>
        {hi} {bye}
      </div>
    );
  }

  const TestComponentContainer = withServices(TestComponent, {
    hi: HelloToken,
    bye: GoodbyeToken,
  });

  const element = React.createElement(TestComponentContainer);
  const app = new App(element);

  app.register(HelloToken, HelloPlugin);
  app.register(GoodbyeToken, GoodbyePlugin);

  const sim = getSimulator(app);
  const {body} = await sim.render('/');

  t.ok(body && body.includes('world'));
  t.ok(body && body.includes('moon'));

  t.end();
});

tape('inject services (legacy)', async t => {
  const createContext = React.createContext;

  // $FlowFixMe
  React.createContext = undefined;

  const HelloToken = createToken('hola');
  const HelloPlugin = createPlugin({
    provides() {
      return 'world';
    },
  });

  const GoodbyeToken = createToken('adios');
  const GoodbyePlugin = createPlugin({
    provides() {
      return 'moon';
    },
  });

  function TestComponent({hi, bye}) {
    t.equal(hi, 'world');
    t.equal(bye, 'moon');

    return (
      <div>
        {hi} {bye}
      </div>
    );
  }

  const TestComponentContainer = withServices(TestComponent, {
    hi: HelloToken,
    bye: GoodbyeToken,
  });

  const element = React.createElement(TestComponentContainer);
  const app = new App(element);

  app.register(HelloToken, HelloPlugin);
  app.register(GoodbyeToken, GoodbyePlugin);

  const sim = getSimulator(app);
  const {body} = await sim.render('/');

  t.ok(body && body.includes('world'));
  t.ok(body && body.includes('moon'));

  // $FlowFixMe
  React.createContext = createContext;

  t.end();
});
