// @flow
import {listSourceLines} from '../../cli/listSourceLines.js';

test('listSourceLines', () => {
  const dep = {
    name: '',
    type: 'both',
    sources: [
      {type: 'token', source: '/foo/bar.js:1:2'},
      {type: 'plugin', source: '/foo/bar.js:3:4'},
    ],
    dependencies: [],
  };
  const lines = listSourceLines(dep, 'plugin');
  expect(lines).toEqual(['/foo/bar.js:3:4']);
});
