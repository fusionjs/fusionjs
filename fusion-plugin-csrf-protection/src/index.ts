/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import serverCsrf from "./server";
import clientCsrf from "./browser";

declare var __NODE__: Boolean;
export default __NODE__ ? serverCsrf : clientCsrf;

export { CsrfIgnoreRoutesToken } from "./shared";
