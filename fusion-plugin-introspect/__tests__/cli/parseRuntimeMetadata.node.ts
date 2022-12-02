import {mockFs} from './mockFs';
import {parseRuntimeMetadata} from '../../src/shared/parseRuntimeMetadata.js';

test('parseRuntimeMetadata', async () => {
  const mock = mockFs();
  const data = await parseRuntimeMetadata();
  expect(data).toEqual(mock);
});
