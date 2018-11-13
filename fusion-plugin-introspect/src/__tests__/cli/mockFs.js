// @flow
import fs from 'fs';

export const mockFs = (mock: Object = {}) => {
  jest
    .spyOn(fs, 'readFile')
    .mockImplementation((file, args, cb) => cb(null, JSON.stringify(mock)));
  return mock;
};
