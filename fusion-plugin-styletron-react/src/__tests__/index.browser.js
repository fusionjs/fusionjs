/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import tape from 'tape-cup';
import React from 'react';
import {styled, Provider as StyletronProvider} from 'styletron-react';

import type {Context} from 'fusion-core';

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
  const ctx: Context = ({
    element: <SilverPanel />,
  }: any);
  const next = () => {
    t.pass('Called next()');
    t.equal(
      ctx.element.type,
      StyletronProvider,
      'StyletronProvider wrapping ctx.element'
    );

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
