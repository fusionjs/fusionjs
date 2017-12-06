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
import plugin from '../../server.js';

test('Instantiation', t => {
  const a = {};
  const b = {};
  const Emitter = plugin();
  t.notEqual(Emitter.of(a), Emitter.of(b));
  t.notEqual(Emitter.of(a), Emitter.of());
  t.end();
});

test('Server EventEmitter - events from browser', async t => {
  let called = false;
  let globalCalled = false;
  const mockCtx = {
    method: 'POST',
    path: '/_events',
    request: {
      body: {
        items: [{type: 'a', payload: {x: 1}}],
      },
    },
  };
  const Emitter = plugin();
  const globalEmitter = Emitter.of();
  globalEmitter.on('a', ({x}, ctx) => {
    t.equals(x, 1, 'payload is correct');
    t.equals(ctx, mockCtx, 'ctx is correct');
    globalCalled = true;
  });
  const emitter = Emitter.of(mockCtx);
  emitter.on('a', ({x}, ctx) => {
    t.equals(x, 1, 'payload is correct');
    t.equals(ctx, mockCtx, 'ctx is correct');
    called = true;
  });
  await Emitter.middleware(mockCtx, () => Promise.resolve());
  t.ok(called, 'called');
  t.ok(globalCalled, 'called global handler');
  t.end();
});

test('Server EventEmitter - events with ctx', async t => {
  let globalCalled = false;
  const mockCtx = {mock: true};
  const Emitter = plugin();
  const globalEmitter = Emitter.of();
  globalEmitter.on('b', ({x}, ctx) => {
    t.equals(x, 1, 'payload is correct');
    t.equals(ctx, mockCtx, 'ctx is correct');
    globalCalled = true;
  });
  globalEmitter.emit('b', {x: 1}, mockCtx);
  t.ok(globalCalled, 'called global handler');
  t.end();
});

test('Server EventEmitter - mapping', async t => {
  let called = false;
  let globalCalled = false;
  const ctx = {
    method: 'POST',
    path: '/lol',
  };
  const Emitter = plugin();
  const globalEmitter = Emitter.of();
  globalEmitter.on('a', (payload, c) => {
    t.equal(c, ctx, 'ctx is passed to global handlers');
    t.deepLooseEqual(
      payload,
      {x: true, b: true, global: true},
      'payload is correct for global'
    );
    globalCalled = true;
  });
  globalEmitter.map('a', (payload, c) => {
    t.equal(c, ctx, 'ctx is passed to global mappers');
    return {...payload, global: true};
  });
  const emitter = Emitter.of(ctx);
  emitter.on('a', (payload, c) => {
    t.equal(c, ctx, 'ctx is passed to scoped handlers');
    t.deepLooseEqual(
      payload,
      {x: true, b: true, global: true},
      'payload is correct'
    );
    called = true;
  });
  emitter.map('a', (payload, c) => {
    t.equal(c, ctx, 'ctx is passed to scoped mappers');
    return {...payload, b: true};
  });
  emitter.emit('a', {x: 1});
  await Emitter.middleware(ctx, () => Promise.resolve());
  t.ok(called, 'called');
  t.ok(globalCalled, 'called global handler');
  t.end();
});

test('Server EventEmitter batching', async t => {
  let called = false;
  const ctx = {
    method: 'POST',
    path: '/lol',
  };
  const Emitter = plugin();
  const emitter = Emitter.of(ctx);
  emitter.on('test', ({x}) => {
    t.equals(x, 1, 'payload is correct');
    called = true;
  });
  t.notOk(called, 'batches events');
  emitter.emit('test', {x: 1});
  await Emitter.middleware(ctx, () => Promise.resolve());
  t.ok(called, 'called');
  t.end();
});
