// @flow
import {mockFs} from './mockFs.js';
import {tokens} from '../../cli/tokens.js';

test('tokens', async () => {
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
  });
  const data = await tokens();
  expect(data.includes('Server:')).toBe(true);
  expect(data.includes('ABC')).toBe(true);
  expect(data.includes('foo/bar:1:2')).toBe(true);
});
