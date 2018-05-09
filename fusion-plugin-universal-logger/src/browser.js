/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';

import type {UniversalLoggerPluginType} from './types.js';

const supportedLevels = [
  'trace',
  'debug',
  'info',
  'access',
  'warn',
  'error',
  'fatal',
];

function normalizeErrors(value) {
  if (value && value instanceof Error) {
    const error = {};
    Object.getOwnPropertyNames(value).forEach(key => {
      error[key] = value[key];
    });
    return {error};
  }
  return value;
}

const plugin =
  __BROWSER__ &&
  createPlugin({
    deps: {
      emitter: UniversalEventsToken,
    },
    provides: ({emitter}) => {
      class UniversalLogger {
        constructor() {
          supportedLevels.forEach(level => {
            // $FlowFixMe
            this[level] = (...args) => {
              return this.log(level, ...args);
            };
          });
        }
        log(level, ...args) {
          return emitter.emit('universal-log', {
            level,
            args: args.map(normalizeErrors),
          });
        }
      }
      // $FlowFixMe
      return new UniversalLogger();
    },
  });

export default ((plugin: any): UniversalLoggerPluginType);
