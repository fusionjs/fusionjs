import test from './test-helper';
import {memoize} from '../memoize';

test('memoize', t => {
  const mockCtx = {
    memoized: new Map(),
  };

  let counter = 0;
  const memoized = memoize(() => {
    return ++counter;
  });

  let counterB = 0;
  const memoizedB = memoize(() => {
    return ++counterB;
  });

  t.equal(memoized(mockCtx), 1, 'calls function when it has no value');
  t.equal(memoized(mockCtx), 1, 'memoizes correctly');
  t.equal(memoizedB(mockCtx), 1, 'calls function when it has no value');
  t.equal(memoizedB(mockCtx), 1, 'memoizes correctly');
  t.equal(memoized(mockCtx), 1, 'calls function when it has no value');
  t.equal(memoized(mockCtx), 1, 'memoizes correctly');
  t.end();
});
