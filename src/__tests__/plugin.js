/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import * as React from 'react';
import PropTypes from 'prop-types';

import ReactPlugin from '../plugin';

test('.create works', t => {
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
    t.notEquals(ctx.element, element, 'wraps provider');
    // $FlowFixMe
    t.equals(ctx.element.type.displayName, 'FooProvider');
    // $FlowFixMe
    t.equals(ctx.element.type.childContextTypes.foo, PropTypes.any.isRequired);
    t.end();
  });
});

test('idempotency with wrapped middleware', async t => {
  let called = 0;
  const foo = 'foo';
  const bar = 'bar';
  const baz = 'baz';
  const expectedDeps = [foo, bar];
  const expectedSelf = [bar, baz];
  const plugin = ReactPlugin.create('foo', {
    middleware: (deps, self) => async () => {
      t.equal(deps, expectedDeps.shift());
      t.equal(self, expectedSelf.shift());
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
  t.equals(called, 2, 'called two times');
  t.end();
});
