/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

import ReactPlugin from '../src/plugin';

test('.create works', done => {
  class Foo {
    foo() {}
  }
  const plugin = ReactPlugin.create('foo', {});
  // $FlowFixMe
  const middleware = plugin.middleware({}, new Foo());
  const element = React.createElement('div');
  const ctx = {element};
  // $FlowFixMe
  middleware(ctx, () => Promise.resolve()).then(() => {
    expect(ctx.element).not.toBe(element);
    // $FlowFixMe
    expect(ctx.element.type.displayName).toBe('FooProvider');
    // $FlowFixMe
    expect(ctx.element.type.childContextTypes.foo).toBe(
      PropTypes.any.isRequired
    );
    done();
  });
});

test('idempotency with wrapped middleware', async () => {
  let called = 0;
  const foo = 'foo';
  const bar = 'bar';
  const baz = 'baz';
  const expectedDeps = [foo, bar];
  const expectedSelf = [bar, baz];
  const plugin = ReactPlugin.create('foo', {
    middleware: (deps, self) => async () => {
      expect(deps).toBe(expectedDeps.shift());
      expect(self).toBe(expectedSelf.shift());
      called += 1;
    },
  });
  // $FlowFixMe
  const middleware = plugin.middleware(foo, bar);
  // $FlowFixMe
  const middleware2 = plugin.middleware(bar, baz);
  const element = React.createElement('div');
  const ctx = {element};
  // $FlowFixMe
  middleware(ctx, () => Promise.resolve());
  // $FlowFixMe
  middleware2(ctx, () => Promise.resolve());
  expect(called).toBe(2);
});
