/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const EventEmitter = require('events');

module.exports = function Shared(context /*: any */) {
  const emitter = new EventEmitter();
  const share = {
    compilerDone: function() {
      // We are now on valid state
      context.state = true;
      emitter.emit('ready');
    },
    compilerInvalid: function() {
      // We are now in invalid state
      context.state = false;
      //resolve async
      if (arguments.length === 2 && typeof arguments[1] === 'function') {
        const callback = arguments[1];
        callback();
      }
    },
    handleRequest: function(
      filename /*: string */,
      processRequest /*: () => any */
    ) {
      share.waitUntilValid(processRequest);
    },
    waitUntilValid: function(callback /*: () => any */) {
      if (context.state) {
        return callback();
      }
      emitter.once('ready', callback);
    },
  };

  context.compiler.hooks.done.tap('Shared', share.compilerDone);
  context.compiler.hooks.invalid.tap('Shared', share.compilerInvalid);
  context.compiler.hooks.watchRun.tap('Shared', share.compilerInvalid);
  context.compiler.hooks.run.tap('Shared', share.compilerInvalid);

  return share;
};
