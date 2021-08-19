/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
export {
  styled,
  withStyle,
  withStyleDeep,
  withTransform,
  withWrapper,
} from 'styletron-react';

declare const AtomicPrefixToken: fusion_core.Token<string>;

declare const StyletronMonolithicPlugin: fusion_core.FusionPlugin<any, any>;
declare const _default: fusion_core.FusionPlugin<any, any>;

export {AtomicPrefixToken, StyletronMonolithicPlugin, _default as default};
