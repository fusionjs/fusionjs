/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

import {Translate} from 'fusion-plugin-i18n-react';

export default (
  <div>
    <Translate id="test" data={{value: 'world'}} />
  </div>
);
