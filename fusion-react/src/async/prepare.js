/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import ssrPrepass from 'react-ssr-prepass';

class PrepareState {
  seen: Map<any, Set<string>>;
  pending: Map<any, Map<string, Promise<any>>>;

  constructor() {
    this.seen = new Map();
    this.pending = new Map();
  }

  isResolved(Component, effectId, effectPromiseThunk) {
    let seenEffectIds = this.seen.get(Component);
    let pendingPromises = this.pending.get(Component);

    // Initialize if not present
    if (!seenEffectIds) {
      seenEffectIds = new Set();
      this.seen.set(Component, seenEffectIds);
    }

    // If seen and not pending, then it has been resolved
    if (
      seenEffectIds.has(effectId) &&
      (!pendingPromises || !pendingPromises.has(effectId))
    ) {
      return true;
    }

    // If not yet seen, need to start promise
    if (!seenEffectIds.has(effectId)) {
      if (!pendingPromises) {
        pendingPromises = new Map();
        this.pending.set(Component, pendingPromises);
      }

      const effectPromise = effectPromiseThunk();
      seenEffectIds.add(effectId);
      pendingPromises.set(effectId, effectPromise);
    }

    return false;
  }

  consumeAndAwaitPromises() {
    let promises = [];
    for (let map of this.pending.values()) {
      for (let promise of map.values()) {
        promises.push(promise);
      }
    }

    this.pending = new Map(); // clear
    return Promise.all(promises);
  }
}

export default function prepare(element: any, ctx: any) {
  const prepareState = new PrepareState();

  class PrepareContextProvider extends React.Component<{}> {
    getChildContext() {
      return {
        __IS_PREPARE__: true,
        __PREPARE_STATE__: prepareState,
      };
    }
    render() {
      return element;
    }
  }
  PrepareContextProvider.childContextTypes = {
    __PREPARE_STATE__: () => {},
    __IS_PREPARE__: () => {},
  };

  async function process() {
    if (ctx && ctx.timing) {
      ctx.timing.markPrepass();
    }
    await ssrPrepass(React.createElement(PrepareContextProvider));
    if (ctx && ctx.timing) {
      ctx.timing.markPrepass(prepareState.pending.size);
    }
    if (prepareState.pending.size) {
      return prepareState.consumeAndAwaitPromises().then(process);
    }
  }

  return Promise.resolve().then(process);
}
