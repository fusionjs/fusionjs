// @noflow
import {test} from 'fusion-test-utils';

import classPropFixture from '../class-props';

test('Class properties work /w flow annotation', async assert => {
  const result = new classPropFixture();
  assert.equal(
    result.classProp(),
    true,
    'class props work and evaluates to true'
  );
});
