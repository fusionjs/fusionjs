/* eslint-env node */
import {withDependencies} from 'fusion-core';
import {createOptionalToken} from 'fusion-tokens';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {Logger} from 'winston';

export const UniversalLoggerConfigToken = createOptionalToken(
  'UniversalLoggerConfigToken',
  null
);
export default withDependencies({
  emitter: UniversalEventsToken,
  config: UniversalLoggerConfigToken,
})(({emitter, config}) => {
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
});
