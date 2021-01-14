/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import useFontLoading from './use-font-loading';
import withFontLoading from './with-font-loading';
import FontLoaderReactPlugin from './plugin';
import {FontLoaderReactToken, FontLoaderReactConfigToken} from './tokens';
import type {
  ConfigType,
  AtomicFontsObjectType,
  StyledFontsObjectType,
} from './types';

export default FontLoaderReactPlugin;
export {
  useFontLoading,
  withFontLoading,
  FontLoaderReactToken,
  FontLoaderReactConfigToken,
};
export type {ConfigType, AtomicFontsObjectType, StyledFontsObjectType};
