/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'tape-cup';
import React from 'react';
import PropTypes from 'prop-types';
import ReactPlugin from '../plugin';

test('.create works', t => {
  class Foo {
    foo() {}
  }
  const plugin = ReactPlugin.create('foo', {});
  const middleware = plugin.middleware({}, new Foo());
  const element = React.createElement('div');
  const ctx = {element};
  middleware(ctx, () => Promise.resolve()).then(() => {
    t.notEquals(ctx.element, element, 'wraps provider');
    t.equals(ctx.element.type.displayName, 'FooProvider');
    t.equals(ctx.element.type.childContextTypes.foo, PropTypes.any.isRequired);
    t.end();
  });
});
