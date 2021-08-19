/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import {Token} from 'fusion-core';

declare type DepsType = {
  manifest: typeof WebAppManifestToken;
};
declare type Icon = {
  src: string;
  sizes: string;
  type: string;
};
declare type App = {
  platform: string;
  url: string;
  id: string;
};
declare type Screenshot = {
  src: string;
  sizes: string;
  type: string;
};
declare type ServiceWorker = {
  src: string;
  scope: string;
  type: string;
  update_via_cache: string;
};
declare type WebAppManifestType = {
  background_color: string;
  categories: string[];
  description: string;
  dir: 'auto' | 'ltr' | 'rtl';
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  iarc_rating_id: string;
  icons: Icon[];
  lang: string;
  name: string;
  orientation:
    | 'any'
    | 'natural'
    | 'landscape'
    | 'landscape-primary'
    | 'landscape-secondary'
    | 'portrait'
    | 'portrait-primary'
    | 'portrait-secondary';
  prefer_related_applications: string;
  related_applications: App[];
  scope: string;
  screenshots: Screenshot[];
  serviceworker: ServiceWorker;
  short_name: string;
  start_url: string;
  theme_color: string;
};

declare const WebAppManifestToken: Token<WebAppManifestType>;

declare const plugin: fusion_core.FusionPlugin<DepsType, void>;

export {WebAppManifestToken, plugin as default};
