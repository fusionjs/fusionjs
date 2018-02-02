/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */
import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {Logger} from 'winston';
import {UniversalLoggerConfigToken} from './tokens';

export default __NODE__ &&
  createPlugin({
    deps: {
      emitter: UniversalEventsToken,
      config: UniversalLoggerConfigToken.optional,
    },
    provides: ({emitter, config}) => {
      const logger = new Logger(config);
      emitter.on('universal-log', ({level, args}) => {
        logger[level](...args);
      });
      class UniversalLogger {}
      for (const key in logger) {
        if (typeof logger[key] === 'function') {
          UniversalLogger.prototype[key] = (...args) => logger[key](...args);
        }
      }
      return new UniversalLogger();
    },
  });
