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

test('Server EventEmitter', async t => {
  let called = false;
  const ctx = {
    method: 'POST',
    path: '/_events',
    request: {
      body: {
        items: [{type: 'a', payload: {x: 1}}],
      },
    },
  };
  const Emitter = plugin();
  const emitter = Emitter.of(ctx);
  emitter.on('a', ({x}) => {
    t.equals(x, 1, 'payload is correct');
    called = true;
  });
  await Emitter.middleware(ctx, () => Promise.resolve());
  t.ok(called, 'called');
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
