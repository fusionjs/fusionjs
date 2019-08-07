// @flow

declare module "@yarnpkg/lockfile" {
  declare export type Lockfile = {
    [key: string]: {
      version: string,
      resolved: string,
      integrity: string,
      dependencies: { [key: string]: string }
    }
  };
  declare module.exports: {|
    stringify(lockfile: Lockfile): string,
    parse(contents: string): {| type: 'success', object: Lockfile |},
  |};
}