// @noflow
import React from 'react';
import Enzyme, {shallow} from 'enzyme';
import {test} from 'fusion-test-utils';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

test('Enzyme wrapper snapshotting', assert => {
  const wrapper = shallow(<div data-should-fail />);
  assert.matchSnapshot(wrapper);
});
