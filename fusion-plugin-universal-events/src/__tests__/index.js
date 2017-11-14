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

import test from 'tape-cup';
import EventEmitter from '../emitter.js';

test('Base EventEmitter on/off', t => {
  t.ok(typeof EventEmitter === 'function', 'exported correctly');
  const events = new EventEmitter();
  let eventHandlerCount = 0;
  function handleEvent(event) {
    eventHandlerCount++;
    t.equal(event, 'test-data', 'correct payload passed to handler');
  }
  events.on('some-event', handleEvent);
  events.emit('other-event', 'other-data');
  events.emit('some-event', 'test-data');
  t.equal(eventHandlerCount, 1, 'calls handler one time');
  events.off('some-event', handleEvent);
  events.emit('some-event', 'test-data');
  t.equal(eventHandlerCount, 1, 'does not call the handler after removal');
  t.end();
});

test('Base EventEmitter mappers', t => {
  const events = new EventEmitter();
  let eventHandlerCount = 0;
  let mapCount = 0;
  events.on('test', event => {
    eventHandlerCount++;
    t.equal(event.a, true, 'correct payload passed to handler');
    t.equal(event.b, true, 'correct payload passed to handler');
  });
  events.map('test', event => {
    mapCount++;
    return Object.assign(event, {a: true});
  });
  events.emit('test', {b: true});
  t.equal(eventHandlerCount, 1, 'calls handler one time');
  t.equal(mapCount, 1, 'calls mapper one time');
  t.end();
});

test('Base EventEmitter * mappers', t => {
  const events = new EventEmitter();
  events.map('*', payload => {
    return {...payload, a: true};
  });
  events.map('test', payload => {
    return {...payload, b: true};
  });
  events.on('test', payload => {
    t.deepLooseEqual(payload, {
      a: true,
      b: true,
      c: true,
    });
    t.end();
  });
  events.emit('test', {c: true});
});

test('Base EventEmitter implicit * mappers', t => {
  const events = new EventEmitter();
  events.map(payload => {
    return {...payload, a: true};
  });
  events.map('test', payload => {
    return {...payload, b: true};
  });
  events.on('test', payload => {
    t.deepLooseEqual(payload, {
      a: true,
      b: true,
      c: true,
    });
    t.end();
  });
  events.emit('test', {c: true});
});

test('Base EventEmitter * handlers', t => {
  const events = new EventEmitter();
  let calledGlobal = false;
  let calledNormal = false;
  events.on(payload => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    calledGlobal = true;
  });

  events.on('test', payload => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    calledNormal = true;
  });
  events.emit('test', {c: true});
  t.ok(calledGlobal);
  t.ok(calledNormal);
  t.end();
});

test('Base EventEmitter implicit * handlers', t => {
  const events = new EventEmitter();
  let calledGlobal = false;
  let calledNormal = false;
  events.on('*', payload => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    calledGlobal = true;
  });

  events.on('test', payload => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    calledNormal = true;
  });
  events.emit('test', {c: true});
  t.ok(calledGlobal);
  t.ok(calledNormal);
  t.end();
});
