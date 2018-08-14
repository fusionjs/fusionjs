/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';

import EventEmitter from '../emitter.js';
import type {IEmitter} from '../types.js';

test('Base EventEmitter on/off', t => {
  t.ok(typeof EventEmitter === 'function', 'exported correctly');
  const events: IEmitter = new EventEmitter();
  let eventHandlerCount = 0;
  function handleEvent(event) {
    eventHandlerCount++;
    t.equal(event, 'test-data', 'correct payload passed to handler');
  }
  events.on('some-event', handleEvent);
  events.handleEvent('other-event', 'other-data');
  events.handleEvent('some-event', 'test-data');
  t.equal(eventHandlerCount, 1, 'calls handler one time');
  events.off('some-event', handleEvent);
  events.handleEvent('some-event', 'test-data');
  t.equal(eventHandlerCount, 1, 'does not call the handler after removal');
  t.end();
});

test('Base EventEmitter mappers', t => {
  const events: IEmitter = new EventEmitter();
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
  const mappedPayload = events.mapEvent('test', {b: true});
  events.handleEvent('test', mappedPayload);
  t.equal(eventHandlerCount, 1, 'calls handler one time');
  t.equal(mapCount, 1, 'calls mapper one time');
  t.end();
});

test('Base EventEmitter * mappers', t => {
  const events: IEmitter = new EventEmitter();
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
  const mappedPayload = events.mapEvent('test', {c: true});
  events.handleEvent('test', mappedPayload);
});

test('Base EventEmitter implicit * mappers', t => {
  const events: IEmitter = new EventEmitter();
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
  const mappedPayload = events.mapEvent('test', {c: true});
  events.handleEvent('test', mappedPayload);
});

test('Base EventEmitter * handlers', t => {
  const events: IEmitter = new EventEmitter();
  let calledGlobal = false;
  let calledNormal = false;
  events.on((payload, ctx, type) => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    t.equal(type, 'test', 'correct type passed to handler');
    calledGlobal = true;
  });

  events.on('test', payload => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    calledNormal = true;
  });
  events.handleEvent('test', {c: true});
  t.ok(calledGlobal);
  t.ok(calledNormal);
  t.end();
});

test('Base EventEmitter implicit * handlers', t => {
  const events: IEmitter = new EventEmitter();
  let calledGlobal = false;
  let calledNormal = false;
  events.on('*', (payload, ctx, type) => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    t.equal(type, 'test', 'correct type passed to handler');
    calledGlobal = true;
  });

  events.on('test', payload => {
    t.deepLooseEqual(payload, {
      c: true,
    });
    calledNormal = true;
  });
  events.handleEvent('test', {c: true});
  t.ok(calledGlobal);
  t.ok(calledNormal);
  t.end();
});
