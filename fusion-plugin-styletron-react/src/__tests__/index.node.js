/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */
import tape from 'tape-cup';
import React from 'react';
import {renderToString} from 'react-dom/server';

import {consumeSanitizedHTML} from 'fusion-core';
import {styled, StyletronProvider} from 'styletron-react';
import plugin from '../server';

const SilverPanel = styled('div', {
  backgroundColor: 'silver',
});

tape('Server plugin', t => {
  const ctx = {
    element: <SilverPanel />,
    template: {
      head: {
        push: h => {
          t.equal(
            consumeSanitizedHTML(h),
            '<style class="_styletron_hydrate_">.a{background-color:silver}</style>',
            'Pushes generated styles to head'
          );
        },
      },
    },
  };
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

  const middleware = plugin.middleware();
  const result = middleware(ctx, next);
  t.ok(result instanceof Promise, 'returns next');
  t.end();
});
