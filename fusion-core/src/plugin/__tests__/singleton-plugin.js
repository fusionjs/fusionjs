import test from './test';
import SingletonPlugin from '../singleton-plugin/singleton-plugin';

test('instantiates with `of` method', t => {
  class A {}
  const p = new SingletonPlugin({Service: A});
  t.ok(p.of() instanceof A, 'p.of() instanceof A');
  t.end();
});

test('has expected methods', t => {
  class A extends SingletonPlugin {}
  const p = new SingletonPlugin({Service: A});
  t.ok(typeof p.of === 'function', 'p.of is function');
  t.end();
});

test('memoizes to singleton instance of most specific class', t => {
  class A {}
  class B {}
  class C extends A {
    thing() {}
  }
  const pa = new SingletonPlugin({Service: A});
  const pb = new SingletonPlugin({Service: B});
  const pc = new SingletonPlugin({Service: C});

  const a = pa.of();
  t.equals(a, pa.of(), 'pa.of() equals pa.of()');
  t.notEquals(pa.of(), pb.of(), 'pa.of() does not equal pb.of()');
  t.notEquals(pa.of(), pc.of(), 'pa.of() does not equal pc.of()');
  t.equals(a, pa.of(), 'pa.of() equals pa.of()'); // ensure no unexpected side effects
  t.equals(pa.of({}), pa.of({}), 'pa.of({}) equals pa.of({})'); // check that the non-singleton API still holds
  t.equals(a, pa.of({}), 'a equals pa.of({})');
  t.end();
});
