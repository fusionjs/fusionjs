import fs from 'fs';

export const mockFs = (mock: any = {}) => {
  jest
    .spyOn(fs, 'readFile')
    // @ts-ignore
    .mockImplementation((file, args, cb) => cb(null, JSON.stringify(mock)));
  return mock;
};
