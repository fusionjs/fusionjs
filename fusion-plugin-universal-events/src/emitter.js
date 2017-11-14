// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

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
