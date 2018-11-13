// @flow
import {mockFs} from './mockFs.js';
import {why} from '../../cli/why.js';

test('why', async () => {
  mockFs({
    version: '0.0.0',
    server: [
      {
        timestamp: 0,
        dependencies: [
          {
            name: 'A',
            type: 'both',
            sources: [{type: 'register', source: 'foo/bar:1:2'}],
            dependencies: ['B'],
          },
          {
            name: 'B',
            type: 'both',
            sources: [{type: 'register', source: 'foo/bar:3:4'}],
            dependencies: ['C'],
          },
          {
            name: 'C',
            type: 'both',
            sources: [{type: 'register', source: 'foo/bar:5:6'}],
            dependencies: [],
          },
        ],
      },
    ],
  });
  const data = await why('B');
  expect(data).toMatchSnapshot();
});
