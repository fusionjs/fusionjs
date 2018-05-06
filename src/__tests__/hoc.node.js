/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import React from 'react';
import {createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import PropTypes from 'prop-types';
import App from '../index';
import hoc from '../hoc';
import plugin from '../plugin';

tape('hoc', async t => {
  const withTest = hoc.create('test');
  const testProvides = {hello: 'world'};
  let didRender = false;
  function TestComponent(props) {
    didRender = true;
    t.deepLooseEqual(props.test, testProvides);
    t.notok(props.ctx, 'does not pass ctx through by default');
    return React.createElement('div', null, 'hello');
  }
  const testPlugin = plugin.create(
    'test',
    createPlugin({provides: () => testProvides})
  );
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(testPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'));
  t.ok(didRender);
  t.end();
});

tape('hoc with mapProvidesToProps', async t => {
  const withTest = hoc.create('test', provides => {
    return {mapped: provides};
  });

  const testProvides = {hello: 'world'};
  let didRender = false;
  function TestComponent(props) {
    didRender = true;
    t.deepLooseEqual(props.mapped, testProvides);
    return React.createElement('div', null, 'hello');
  }

  const testPlugin = plugin.create(
    'test',
    createPlugin({provides: () => testProvides})
  );
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(testPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'));
  t.ok(didRender);
  t.end();
});

tape('hoc with custom provider', async t => {
  const withTest = hoc.create('test');

  const testProvides = {hello: 'world'};
  let didRender = false;
  let didUseCustomProvider = false;
  function TestComponent(props) {
    didRender = true;
    t.deepLooseEqual(props.test, testProvides);
    return React.createElement('div', null, 'hello');
  }
  class CustomProvider extends React.Component<*> {
    getChildContext() {
      return {test: this.props.provides};
    }
    render() {
      didUseCustomProvider = true;
      t.ok(this.props.ctx, 'passes ctx through');
      return React.Children.only(this.props.children);
    }
  }
  CustomProvider.childContextTypes = {
    test: PropTypes.any.isRequired,
  };

  const testPlugin = plugin.create(
    'test',
    createPlugin({provides: () => testProvides}),
    CustomProvider
  );
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(testPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(typeof ctx.body === 'string' && ctx.body.includes('hello'));
  t.ok(didRender);
  t.ok(didUseCustomProvider);
  t.end();
});
