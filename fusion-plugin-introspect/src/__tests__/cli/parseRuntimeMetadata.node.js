// @flow
import {mockFs} from './mockFs.js';
import {parseRuntimeMetadata} from '../../cli/parseRuntimeMetadata.js';

test('parseRuntimeMetadata', async () => {
  const mock = mockFs();
  const data = await parseRuntimeMetadata();
  expect(data).toEqual(mock);
});
