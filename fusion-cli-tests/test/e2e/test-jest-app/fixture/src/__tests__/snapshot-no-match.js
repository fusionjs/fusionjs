// @noflow
import React from 'react';
import renderer from 'react-test-renderer';
import {test} from 'fusion-test-utils';

test('Does not match snapshot', assert => {
  const tree = renderer.create(<div data-should-fail />).toJSON();
  assert.matchSnapshot(tree);
});
