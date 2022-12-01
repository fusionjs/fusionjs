/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { HttpHandlerToken } from "./tokens";

export type DepsType = {
  handler: typeof HttpHandlerToken;
};

export type ServiceType = (
  c: unknown,
  b: unknown,
  a: (error?: any) => Promise<any>
) => void;

export type ConfigType = {
  defer: boolean;
};
