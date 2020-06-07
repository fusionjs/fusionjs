// @noflow
import {test} from 'fusion-test-utils';

test('__DEV__ environment variable is set', assert => {
  assert.equal(__DEV__, true);
});
