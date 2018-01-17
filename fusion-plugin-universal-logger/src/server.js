/* eslint-env node */
import {createPlugin} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {Logger} from 'winston';
import {UniversalLoggerConfigToken} from './tokens';

export default createPlugin({
  deps: {
    emitter: UniversalEventsToken,
    config: UniversalLoggerConfigToken,
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
