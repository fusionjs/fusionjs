/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ProviderPlugin} from 'fusion-react';
import rpc from 'fusion-plugin-rpc';

export default ProviderPlugin.create('rpc', rpc);
