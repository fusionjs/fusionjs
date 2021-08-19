/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {Token} from 'fusion-core';
import * as fusion_tokens from 'fusion-tokens';

declare const CsrfIgnoreRoutesToken: Token<Array<string>>;

declare const _default:
  | ((fetch: fusion_tokens.Fetch) => fusion_tokens.Fetch)
  | ((oldFetch: fusion_tokens.Fetch) => fusion_core.FusionPlugin<
      {
        ignored: fusion_core.Token<string[]>;
      },
      fusion_tokens.Fetch
    >);

export {CsrfIgnoreRoutesToken, _default as default};
