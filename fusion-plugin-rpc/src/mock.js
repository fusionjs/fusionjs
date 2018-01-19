/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {withDependencies} from 'fusion-core';
import MissingHandlerError from './missing-handler-error';
import {RPCHandlersToken} from './tokens';

export default withDependencies({
  handlers: RPCHandlersToken,
})(({handlers} = {}) => {
  class RPC {
    async request(method, args) {
      if (!handlers[method]) {
        throw new MissingHandlerError(method);
      }
      return handlers[method](args);
    }
  }
  return () => new RPC();
});
