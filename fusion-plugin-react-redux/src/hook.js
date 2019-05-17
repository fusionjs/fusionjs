/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {FusionContext, useService} from 'fusion-react';
import {ReduxToken} from './tokens';

export function useRedux() {
  const ctx = React.useContext(FusionContext);
  const {store} = useService(ReduxToken).from(ctx);
  return store;
}

