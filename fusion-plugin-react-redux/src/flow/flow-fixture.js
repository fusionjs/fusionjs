/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App from 'fusion-core';
import {GetInitialStateToken} from '../tokens.js';

const app = new App();

app.register(GetInitialStateToken, async (): Object => {
  return {};
});

app.register(GetInitialStateToken, () => {
  return {};
});

// Failing case for when we can test flow failures
/*
app.register(GetInitialStateToken, async () => {
  return 0;
});
*/
