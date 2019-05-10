/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

process.on('unhandledRejection', e => {
  throw e;
});

const sade = require('sade');

module.exports.run = (args /*: any*/) => {
  const data = require('../commands/index.js');
  const instance = sade('fusion').version(require('../package.json').version);
  for (const [command, metadata] of Object.entries(data)) {
    if (metadata instanceof Object) {
      // $FlowFixMe
      instance.command(command).describe(metadata.descr);
      // Add subcommands
      // $FlowFixMe
      if (metadata.options) {
        // $FlowFixMe
        for (const [opt, optmeta] of Object.entries(metadata.options)) {
          if (optmeta instanceof Object) {
            // $FlowFixMe
            instance.option('--' + opt, optmeta.describe, optmeta.default);
          }
        }
      }
    }
    instance.action((...args) =>
      // $FlowFixMe
      require(`../commands/${command}.js`).run(...args)
    );
  }
  return instance.parse(typeof args === 'string' ? args.split(' ') : args);
};
