// @noflow
import {test} from 'fusion-test-utils';

test('string is transformed', assert => {
  assert.equal('helloworld', 'transformed_helloworld_custom_babel');
});
