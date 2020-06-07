/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import EventEmitter from '../src/emitter.js';
import type {IEmitter} from '../src/types.js';

test('Base EventEmitter on/off', () => {
  expect(typeof EventEmitter === 'function').toBeTruthy();
  const events: IEmitter = new EventEmitter();
  let eventHandlerCount = 0;
  function handleEvent(event) {
    eventHandlerCount++;
    expect(event).toBe('test-data');
  }
  events.on('some-event', handleEvent);
  events.handleEvent('other-event', 'other-data');
  events.handleEvent('some-event', 'test-data');
  expect(eventHandlerCount).toBe(1);
  events.off('some-event', handleEvent);
  events.handleEvent('some-event', 'test-data');
  expect(eventHandlerCount).toBe(1);
});

test('Base EventEmitter mappers', () => {
  const events: IEmitter = new EventEmitter();
  let eventHandlerCount = 0;
  let mapCount = 0;
  events.on('test', event => {
    eventHandlerCount++;
    expect(event.a).toBe(true);
    expect(event.b).toBe(true);
  });
  events.map('test', event => {
    mapCount++;
    return Object.assign(event, {a: true});
  });
  const mappedPayload = events.mapEvent('test', {b: true});
  events.handleEvent('test', mappedPayload);
  expect(eventHandlerCount).toBe(1);
  expect(mapCount).toBe(1);
});

test('Base EventEmitter * mappers', done => {
  const events: IEmitter = new EventEmitter();
  events.map('*', payload => {
    return {...payload, a: true};
  });
  events.map('test', payload => {
    return {...payload, b: true};
  });
  events.on('test', payload => {
    expect(payload).toStrictEqual({
      a: true,
      b: true,
      c: true,
    });
    done();
  });
  const mappedPayload = events.mapEvent('test', {c: true});
  events.handleEvent('test', mappedPayload);
});

test('Base EventEmitter implicit * mappers', done => {
  const events: IEmitter = new EventEmitter();
  events.map(payload => {
    return {...payload, a: true};
  });
  events.map('test', payload => {
    return {...payload, b: true};
  });
  events.on('test', payload => {
    expect(payload).toStrictEqual({
      a: true,
      b: true,
      c: true,
    });
    done();
  });
  const mappedPayload = events.mapEvent('test', {c: true});
  events.handleEvent('test', mappedPayload);
});

test('Base EventEmitter * handlers', () => {
  const events: IEmitter = new EventEmitter();
  let calledGlobal = false;
  let calledNormal = false;
  events.on((payload, ctx, type) => {
    expect(payload).toStrictEqual({
      c: true,
    });
    expect(type).toBe('test');
    calledGlobal = true;
  });

  events.on('test', payload => {
    expect(payload).toStrictEqual({
      c: true,
    });
    calledNormal = true;
  });
  events.handleEvent('test', {c: true});
  expect(calledGlobal).toBeTruthy();
  expect(calledNormal).toBeTruthy();
});

test('Base EventEmitter implicit * handlers', () => {
  const events: IEmitter = new EventEmitter();
  let calledGlobal = false;
  let calledNormal = false;
  events.on('*', (payload, ctx, type) => {
    expect(payload).toStrictEqual({
      c: true,
    });
    expect(type).toBe('test');
    calledGlobal = true;
  });

  events.on('test', payload => {
    expect(payload).toStrictEqual({
      c: true,
    });
    calledNormal = true;
  });
  events.handleEvent('test', {c: true});
  expect(calledGlobal).toBeTruthy();
  expect(calledNormal).toBeTruthy();
});
