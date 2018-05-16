/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
import tape from 'tape-cup';
import React from 'react';
import {renderToString} from 'react-dom/server';

import {consumeSanitizedHTML} from 'fusion-core';
import type {Context} from 'fusion-core';
import {styled, Provider as StyletronProvider} from 'styletron-react';

import plugin from '../server';

const SilverPanel = styled('div', {
  backgroundColor: 'silver',
});

const LegacyComponent = (props, ctx) => {
  ctx.styletron.injectDeclaration({prop: 'color', val: 'red'});
  return <div />;
};

LegacyComponent.contextTypes = {styletron: () => {}};

tape('Server plugin', t => {
  const ctx: Context = ({
    element: (
      <div>
        <SilverPanel />
        <LegacyComponent />
      </div>
    ),
    template: {
      head: {
        push(h) {
          t.equal(
            consumeSanitizedHTML(h),
            '<style class="_styletron_hydrate_">.ae{background-color:silver}.af{color:red}</style>',
            'Pushes generated styles to head'
          );
        },
      },
    },
  }: any);
  const next = () => {
    t.pass('Called next()');
    t.equal(
      ctx.element.type,
      StyletronProvider,
      'StyletronProvider wrapping ctx.element'
    );
    renderToString(ctx.element);
    return Promise.resolve();
  };

  let result = null;
  if (plugin.middleware) {
    const middleware = plugin.middleware();
    result = middleware(ctx, next);
  }
  t.ok(result instanceof Promise, 'returns next');
  t.end();
});
