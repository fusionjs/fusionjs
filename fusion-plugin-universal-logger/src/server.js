/* eslint-env node */
import {Plugin} from 'fusion-core';
import {Logger} from 'winston';

export default function({UniversalEvents, config}) {
  const logger = new Logger(config);
  const events = UniversalEvents.of();
  events.on('universal-log', ({level, args}) => {
    logger[level](...args);
  });
  class UniversalLogger {}
  for (const key in logger) {
    if (typeof logger[key] === 'function') {
      UniversalLogger.prototype[key] = (...args) => logger[key](...args);
    }
  }
  return new Plugin({Service: UniversalLogger});
}
