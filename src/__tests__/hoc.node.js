import tape from 'tape-cup';
import React from 'react';
import {renderToString} from 'react-dom/server';
import hoc from '../hoc';
import provider from '../provider';

tape('hoc', t => {
  const withTest = hoc.create('test');
  const TestProvider = provider.create('test');
  const testService = {hello: 'world'};
  let didRender = false;
  function TestComponent(props) {
    didRender = true;
    t.deepLooseEqual(props.test, testService);
    return React.createElement('div', null, 'hello');
  }
  const element = React.createElement(
    TestProvider,
    {service: testService},
    React.createElement(withTest(TestComponent))
  );
  t.ok(renderToString(element).includes('hello'));
  t.ok(didRender);
  t.end();
});

tape('hoc with mapServiceToProps', t => {
  const withTest = hoc.create('test', service => {
    return {mapped: service};
  });
  const TestProvider = provider.create('test');
  const testService = {hello: 'world'};
  let didRender = false;
  function TestComponent(props) {
    didRender = true;
    t.deepLooseEqual(props.mapped, testService);
    return React.createElement('div', null, 'hello');
  }
  const element = React.createElement(
    TestProvider,
    {service: testService},
    React.createElement(withTest(TestComponent))
  );
  t.ok(renderToString(element).includes('hello'));
  t.ok(didRender);
  t.end();
});
