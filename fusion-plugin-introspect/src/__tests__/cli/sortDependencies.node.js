// @flow
import {sortDependencies} from '../../cli/sortDependencies.js';

test('sortDependencies', async () => {
  const data = sortDependencies([
    {
      name: 'A',
      type: 'both',
      sources: [{type: 'plugin', source: 'foo/bar:1:2'}],
      dependencies: ['B'],
    },
    {
      name: 'B',
      type: 'both',
      sources: [{type: 'plugin', source: 'foo/bar:3:4'}],
      dependencies: ['C'],
    },
    {
      name: 'C',
      type: 'both',
      sources: [{type: 'plugin', source: 'foo/bar:5:6'}],
      dependencies: [],
    },
  ]);
  expect(data).toMatchSnapshot();
});
