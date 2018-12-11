// @noflow
import {test} from 'fusion-test-utils';

import main from '../main';

test('Everything is ok', assert => {
  assert.equal(main(), true);
});
