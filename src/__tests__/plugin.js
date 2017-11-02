import test from 'tape-cup';
import React from 'react';
import PropTypes from 'prop-types';
import {Plugin} from 'fusion-core';
import ReactPlugin from '../plugin';

test('.create works', t => {
  class Foo {
    foo() {}
  }
  const foo = () => new Plugin({Service: Foo});
  const plugin = ReactPlugin.create('foo', foo);
  t.equals(typeof plugin, 'function', 'is plugin');
  t.ok(plugin().of() instanceof Foo, 'extends base');
  t.equals(typeof plugin().of().foo, 'function', 'has expected method');

  const element = React.createElement('div');
  const ctx = {element};
  plugin().middleware(ctx, () => Promise.resolve()).then(() => {
    t.notEquals(ctx.element, element, 'wraps provider');
    t.equals(ctx.element.type.displayName, 'FooProvider');
    t.equals(
      ctx.element.type.childContextTypes.foo,
      PropTypes.object.isRequired
    );
    t.end();
  });
});
