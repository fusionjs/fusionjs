// @flow
import {listDependencies} from '../../cli/listDependencies.js';

test('listDependencies', () => {
  const dep = name => ({name, type: 'both', sources: [], dependencies: []});
  const deps = listDependencies([
    {timestamp: 0, dependencies: [dep('foo'), dep('hello')]},
    {timestamp: 0, dependencies: [dep('bar'), dep('foobar')]},
  ]);
  expect(deps).toEqual([dep('foo'), dep('hello'), dep('bar'), dep('foobar')]);
});
