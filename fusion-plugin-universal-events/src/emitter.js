/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const globalEventType = '*';
export default class UniversalEmitter {
  constructor() {
    this.handlers = {};
    this.mappers = {};
  }
  map(...args) {
    const {type, callback} = getArgs(args);
    if (!this.mappers[type]) this.mappers[type] = [];
    this.mappers[type].push(callback);
  }
  on(...args) {
    const {type, callback} = getArgs(args);
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(callback);
  }
  off(...args) {
    const {type, callback} = getArgs(args);
    const index = this.handlers[type].indexOf(callback);
    if (index > -1) this.handlers[type].splice(index, 1);
  }
  mapEvent(type, payload, ctx) {
    const globalMappers = this.mappers[globalEventType] || [];
    const mappers = (this.mappers[type] || []).concat(globalMappers);
    return mappers.reduce((payload, mapper) => {
      return mapper(payload, ctx);
    }, payload);
  }
  handleEvent(type, payload, ctx) {
    const globalHandlers = this.handlers[globalEventType] || [];
    const handlers = (this.handlers[type] || []).concat(globalHandlers);
    handlers.forEach(handler => handler(payload, ctx));
  }
}

function validateHandler(handler) {
  if (typeof handler !== 'function')
    throw new TypeError('handler must be a function');
}

function getArgs(args) {
  const type = typeof args[0] === 'string' ? args[0] : globalEventType;
  const callback = args[1] || args[0];
  validateHandler(callback);
  return {type, callback};
}
