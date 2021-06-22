// @flow

declare var __NODE__: boolean;
declare var __BROWSER__: boolean;
declare var __DEV__: boolean;

declare var module: {
  hot: {
    accept(path: string, callback: () => void): void,
  },
};
