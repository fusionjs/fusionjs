/* eslint-env browser */
import tape from 'tape-cup';
import React from 'react';
import {styled, StyletronProvider} from 'styletron-react';
import plugin from '../browser';

// TODO(#2) Test if style is hydrated correctly in the browser test
/*
const temp = document.createElement('div');
temp.innerHTML =
  '<style class="_styletron_hydrate_">.a{background-color:silver}</style>';
document.body.appendChild(temp.firstChild);
*/

const SilverPanel = styled('div', {
  backgroundColor: 'silver',
});

tape('Browser plugin', t => {
  const ctx = {
    element: <SilverPanel />,
  };
  const next = () => {
    t.pass('Called next()');
    t.equal(
      ctx.element.type,
      StyletronProvider,
      'StyletronProvider wrapping ctx.element'
    );

    return Promise.resolve();
  };

  const middleware = plugin.middleware();
  const result = middleware(ctx, next);
  t.ok(result instanceof Promise, 'returns next');
  t.end();
});
