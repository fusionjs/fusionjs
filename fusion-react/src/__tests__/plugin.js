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
    t.equals(
      ctx.element.type.childContextTypes.foo,
      PropTypes.object.isRequired
    );
    t.end();
  });
});
