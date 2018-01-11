/* eslint-env node */
import tape from 'tape-cup';
import React from 'react';
import {renderToString} from 'react-dom/server';

import {consumeSanitizedHTML} from 'fusion-core';
import plugin from '../../server';
import {styled} from 'styletron-react';
import {StyletronProvider} from 'styletron-react';

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

  const middleware = plugin();
  const result = middleware(ctx, next);
  t.ok(result instanceof Promise, 'returns next');
  t.end();
});
