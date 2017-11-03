/* eslint-env browser */
import {Plugin} from 'fusion-core';

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

export default function({UniversalEvents}) {
  return new Plugin({
    Service: class UniversalLogger {
      constructor(ctx) {
        //privates
        this.emitter = UniversalEvents.of(ctx);
        supportedLevels.forEach(level => {
          this[level] = (...args) => {
            return this.log(level, ...args);
          };
        });
      }
      log(level, ...args) {
        return this.emitter.emit('universal-log', {
          level,
          args: args.map(normalizeErrors),
        });
      }
    },
  });
}
