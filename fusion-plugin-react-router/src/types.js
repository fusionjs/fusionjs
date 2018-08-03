/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type LocationType = {
  pathname: string,
  search: string,
  hash: string,
  state?: Object,
  key?: string,
};

type NavigationFunctionType = (
  path: string,
  state?: Object
) => void | (LocationType => void);

export type HistoryType = {
  length: number,
  location: LocationType,
  action: string,
  push: NavigationFunctionType,
  replace: NavigationFunctionType,
  go: (n: number) => void,
  goBack: () => void,
  goForward: () => void,
};
