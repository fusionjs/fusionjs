/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App, {createPlugin} from 'fusion-core';
import {GetInitialStateToken} from '../../tokens.js';

import type {Context} from 'fusion-core';

const app = new App();

app.register(
  GetInitialStateToken,
  async (): Object => {
    return {};
  }
);

app.register(GetInitialStateToken, () => {
  return {};
});

app.register(GetInitialStateToken, (ctx: Context) => {
  return {
    something: ctx.state.something,
  };
});

app.register(
  GetInitialStateToken,
  createPlugin({
    provides: () => {
      return async function getInitialState(
        ctx: Context
      ): Promise<{something: any}> {
        return {
          something: ctx.state.something,
        };
      };
    },
  })
);
