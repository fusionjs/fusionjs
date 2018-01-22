/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from './test';
import Plugin from '../plugin/plugin';

test('instantiates with `of` method', t => {
  class A {}
  const ctx = {};
  const p = new Plugin({Service: A});
  t.ok(p.of() instanceof A, 'p.of() instanceof A');
  t.ok(p.of(ctx) instanceof A, 'p.of(ctx) instanceof A');
  t.end();
});

test('memoizes instantiation', t => {
  class A {}
  class B {}
  class C extends A {
    thing() {}
  }
  const ctx1 = {};
  const ctx2 = {};
  const pa = new Plugin({Service: A});
  const pb = new Plugin({Service: B});
  const pc = new Plugin({Service: C});
  t.equals(pa.of(), pa.of(), 'pa.of() equals pa.of()');
  t.equals(pa.of(null), pa.of(void 0), 'pa.of(null) equals pa.of(undefined)');
  t.equals(pa.of(ctx1), pa.of(ctx1), 'pa.of(ctx1) equals pa.of(ctx1)');
  t.notEquals(pa.of(ctx1), pa.of(ctx2), 'pa.of(ctx1) not equal pa.of(ctx2)');
  t.notEquals(pa.of(ctx1), pb.of(ctx1), 'pa.of(ctx1) not equal pa.of(ctx1)');
  t.notEquals(pa.of(ctx1), pc.of(ctx1), 'pa.of(ctx1) not equal pa.of(ctx1)');
  t.notEquals(pb.of(ctx1), pc.of(ctx1), 'pa.of(ctx1) not equal pa.of(ctx1)');
  t.end();
});

test('has expected methods', t => {
  class A {}
  const p = new Plugin({Service: A});
  t.ok(typeof p.of === 'function', 'p.of is function');
  t.end();
});

test('`of` accepts valid keys', t => {
  class A {}
  const p = new Plugin({Service: A});
  t.doesNotThrow(() => p.of(), 'p.of() does not throw');
  t.doesNotThrow(() => p.of({}), 'p.of({}) does not throw');
  t.doesNotThrow(() => p.of([]), 'p.of([]) does not throw');
  t.throws(() => p.of(1), 'p.of(1) throws: key is not gc-able');
  t.throws(() => p.of(false), 'p.of(false) throws: key is not gc-able');
  t.throws(() => p.of(''), 'p.of("") throws: key is not gc-able');
  t.end();
});
