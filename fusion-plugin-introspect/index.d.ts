/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';

declare const storeSync: (value: any) => void;
declare const store: (value: any) => Promise<void>;

declare const fs_storeSync: typeof storeSync;
declare const fs_store: typeof store;
declare namespace fs {
  export {fs_storeSync as storeSync, fs_store as store};
}

declare type IntrospectionSchema = {
  version: string;
  server: Array<Dependencies>;
  browser: Array<Dependencies>;
  runtime: Metadata;
};
declare type Dependencies = {
  timestamp: number;
  dependencies: Array<Dependency>;
  enhanced: Array<{
    name: string;
  }>;
};
declare type Dependency = {
  name: string;
  stack: string;
  dependencies: Array<string>;
};
declare type Metadata = {
  timestamp: number;
  pid: number;
  nodeVersion: string;
  npmVersion: string;
  yarnVersion: string;
  lockFileType: string;
  dependencies: {
    [x: string]: string;
  };
  devDependencies: {
    [x: string]: string;
  };
  varNames: Array<string>;
  vars: {
    [x: string]: string;
  };
};

declare const _default: (
  b: fusion_core.FusionApp,
  a: any
) => fusion_core.FusionPlugin<undefined, undefined>;

declare const fsStore: typeof fs;

export {
  Dependencies,
  Dependency,
  IntrospectionSchema,
  Metadata,
  _default as default,
  fsStore,
};
