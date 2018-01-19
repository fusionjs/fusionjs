import tape from 'tape-cup';
import React from 'react';
import {createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
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
  t.ok(ctx.body.includes('hello'));
  t.ok(didRender);
  t.end();
});

tape('hoc with custom BaseComponent', async t => {
  const withTest = hoc.create('test');
  const testProvides = {hello: 'world'};
  let didRender = false;
  let didUseBase = false;
  function TestComponent(props) {
    didRender = true;
    t.deepLooseEqual(props.test, testProvides);
    t.notok(props.ctx, 'does not pass ctx through by default');
    return React.createElement('div', null, 'hello');
  }
  const testPlugin = plugin.create(
    'test',
    createPlugin({provides: () => testProvides}),
    class BaseComponent extends React.Component {
      constructor(props, context) {
        super(props, context);
        t.ok(props.ctx, 'passes ctx to base component');
        t.deepLooseEqual(props.provides, testProvides);
        didUseBase = true;
      }
      render() {
        return React.Children.only(this.props.children);
      }
    }
  );
  const element = React.createElement(withTest(TestComponent));
  const app = new App(element);
  app.register(testPlugin);
  const sim = getSimulator(app);
  const ctx = await sim.render('/');
  t.ok(ctx.body.includes('hello'));
  t.ok(didRender);
  t.ok(didUseBase);
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
  t.ok(ctx.body.includes('hello'));
  t.ok(didRender);
  t.end();
});
