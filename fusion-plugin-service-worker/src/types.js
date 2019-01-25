// @flow
import type {Token} from 'fusion-core';

import type {Context} from 'fusion-core';

export type PluginServiceType = {
  from: (
    ctx?: Context
  ) => {
    ctx?: Context,
    value: string,
  },
};

export type AssetInfo = {
  precachePaths: Array<RequestInfo>,
  cacheablePaths: Array<RequestInfo>,
};

type ConfigType = AssetInfo => string;
export type ConfigTokenType = Token<ConfigType>;
