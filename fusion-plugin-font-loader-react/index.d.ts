/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ComponentType} from 'react';
import {Token, FusionPlugin} from 'fusion-core';

declare function useFontLoading(fontName: string): any;

declare const withFontLoading: (
  fontName: string
) => (OriginalComponent: ComponentType<any>) => ComponentType<any>;

declare type FontURLsType = {
  woff?: string;
  woff2: string;
};
declare type FontFallbackType = {
  name: string;
  styles?: {
    [x: string]: string;
  };
};
declare type AtomicFontType = {
  urls: FontURLsType;
  fallback?: FontFallbackType;
  styles?: {};
};
declare type AtomicFontsObjectType = {
  [x: string]: AtomicFontType;
};
declare type StyledFontsObjectType = {
  [x: string]: Array<AtomicFontType>;
};
declare type ConfigType = {
  fonts: AtomicFontsObjectType | StyledFontsObjectType;
  preloadDepth?: number;
  withStyleOverloads?: boolean;
  preloadOverrides?: {};
};
declare type ConfigTokenType = Token<ConfigType>;
declare type DepsType = {
  config: ConfigTokenType;
};
declare type ProviderType = {
  getFontDetails: Function | undefined | null;
  atomicFonts: AtomicFontsObjectType | undefined | null;
};
declare type PluginType = FusionPlugin<DepsType, ProviderType>;
declare type FontLoaderPluginType = Token<ProviderType>;

declare const _default: PluginType;

declare const FontLoaderReactToken: FontLoaderPluginType;
declare const FontLoaderReactConfigToken: ConfigTokenType;

export {
  AtomicFontsObjectType,
  ConfigType,
  FontLoaderReactConfigToken,
  FontLoaderReactToken,
  StyledFontsObjectType,
  _default as default,
  useFontLoading,
  withFontLoading,
};
