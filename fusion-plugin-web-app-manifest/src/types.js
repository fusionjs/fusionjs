/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {WebAppManifestToken} from './index';

export type DepsType = {
  manifest: typeof WebAppManifestToken,
};

type Icon = {
  src: string,
  sizes: string,
  type: string,
};

type App = {
  platform: string,
  url: string,
  id: string,
};

type Screenshot = {
  src: string,
  sizes: string,
  type: string,
};

type ServiceWorker = {
  src: string,
  scope: string,
  type: string,
  update_via_cache: string,
};

export type WebAppManifestType = {
  background_color: string,
  categories: string[],
  description: string,
  dir: 'auto' | 'ltr' | 'rtl',
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser',
  iarc_rating_id: string,
  icons: Icon[],
  lang: string,
  name: string,
  orientation: | 'any'
    | 'natural'
    | 'landscape'
    | 'landscape-primary'
    | 'landscape-secondary'
    | 'portrait'
    | 'portrait-primary'
    | 'portrait-secondary',
  prefer_related_applications: string,
  related_applications: App[],
  scope: string,
  screenshots: Screenshot[],
  serviceworker: ServiceWorker,
  short_name: string,
  start_url: string,
  theme_color: string,
};
