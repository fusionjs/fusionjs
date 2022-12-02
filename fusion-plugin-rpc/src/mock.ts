/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createPlugin, RouteTagsToken} from 'fusion-core';
import type {Context} from 'fusion-core';
import type {Fetch} from 'fusion-tokens';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import MissingHandlerError from './missing-handler-error';
import {RPCHandlersToken} from './tokens';
import type {HandlerType} from './tokens';
import type {RPCPluginType, IEmitter} from './types';

class RPC {
  ctx: Context | undefined | null;
  emitter: IEmitter | undefined | null;
  handlers: HandlerType | undefined | null;
  fetch: Fetch | undefined | null;

  constructor(handlers: any) {
    this.handlers = handlers;
  }

  async request<TArgs, TResult>(method: string, args: TArgs): Promise<TResult> {
    if (!this.handlers) {
      throw new Error('fusion-plugin-rpc requires `handlers`');
    }

    if (!this.handlers[method]) {
      throw new MissingHandlerError(method);
    }
    return this.handlers[method](args);
  }
}

const plugin: RPCPluginType = createPlugin({
  deps: {
    RouteTags: RouteTagsToken.optional,
    handlers: RPCHandlersToken,
    // $FlowFixMe
    emitter: UniversalEventsToken.optional,
  },
  provides: ({handlers} = {}) => {
    return {from: () => new RPC(handlers)};
  },
});

export default plugin;
