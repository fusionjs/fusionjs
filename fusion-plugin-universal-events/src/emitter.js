/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context} from 'fusion-core';

import type {IEmitter} from './types.js';

const globalEventType = '*';
export default class UniversalEmitter implements IEmitter {
  handlers: any;
  mappers: any;

  constructor() {
    this.handlers = {};
    this.mappers = {};
  }
  map(...args: *): * {
    const {type, callback} = getArgs(args);
    if (!this.mappers[type]) this.mappers[type] = [];
    this.mappers[type].push(callback);
  }
  on(...args: *): * {
    const {type, callback} = getArgs(args);
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(callback);
  }
  off(...args: *): * {
    const {type, callback} = getArgs(args);
    const index = this.handlers[type].indexOf(callback);
    if (index > -1) this.handlers[type].splice(index, 1);
  }
  mapEvent(type: mixed, payload: mixed, ctx?: Context): mixed {
    const globalMappers = this.mappers[globalEventType] || [];
    const mappers = (this.mappers[type] || []).concat(globalMappers);
    return mappers.reduce((payload, mapper) => {
      return mapper(payload, ctx, type);
    }, payload);
  }
  handleEvent(type: mixed, payload: mixed, ctx?: Context): void {
    const globalHandlers = this.handlers[globalEventType] || [];
    const handlers = (this.handlers[type] || []).concat(globalHandlers);
    handlers.forEach(handler => handler(payload, ctx, type));
  }

  /* eslint-disable-next-line  no-unused-vars */
  from(ctx: Context) {
    throw new Error('Not implemented.');
  }
  /* eslint-disable-next-line  no-unused-vars */
  emit(type: mixed, payload: mixed, ctx?: Context) {
    // throw new Error('Not implemented.');
  }
  /* eslint-disable-next-line  no-unused-vars */
  setFrequency(frequency: number) {
    throw new Error('Not implemented.');
  }
  teardown() {
    throw new Error('Not implemented.');
  }
  flush() {
    throw new Error('Not implemented.');
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
