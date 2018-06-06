// @flow

import type {Context} from 'fusion-core';

export type PluginServiceType = {
  from: (
    ctx?: Context
  ) => {
    ctx?: Context,
    value: string,
  },
};
