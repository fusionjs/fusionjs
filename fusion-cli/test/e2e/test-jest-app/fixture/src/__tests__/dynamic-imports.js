// @noflow
import {test} from 'fusion-test-utils';

import dynamicImport from '../dynamic-import';

test('Dynamic imports work', async assert => {
  const result = await dynamicImport();
  assert.equal(result, true, 'dynamic import works and evaluates to true');
});
