// @flow
import {mockFs} from './mockFs.js';
import {where} from '../../cli/where.js';

test('where', async () => {
  mockFs({
    version: '0.0.0',
    server: [
      {
        timestamp: 0,
        dependencies: [
          {
            name: 'ABC',
            type: 'both',
            sources: [{type: 'register', source: 'foo/bar:1:2'}],
            dependencies: [],
          },
        ],
      },
    ],
    browser: [],
  });
  const data = await where('ABC');
  expect(data.includes('foo/bar:1:2')).toBe(true);
});
