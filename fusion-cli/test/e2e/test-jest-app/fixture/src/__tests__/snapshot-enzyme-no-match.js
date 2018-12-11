// @noflow
import React from 'react';
import {shallow} from 'enzyme';
import {test} from 'fusion-test-utils';

test('Enzyme wrapper snapshotting', assert => {
  const wrapper = shallow(<div data-should-fail />);
  assert.matchSnapshot(wrapper);
});
