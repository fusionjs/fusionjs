/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {HttpHandlerToken} from './tokens.js';

export type DepsType = {
  handler: typeof HttpHandlerToken,
};

export type ServiceType = (mixed, mixed, (error?: any) => Promise<any>) => void;

export type ConfigType = {
  defer: boolean,
};
