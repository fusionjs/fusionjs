/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import * as React from 'react';

import FusionApp, {createPlugin} from 'fusion-core';
import {prepare, middleware} from 'fusion-react-async';

import serverRender from './server';
import clientRender from './client';

import ProviderPlugin from './plugin';
import ProvidedHOC from './hoc';
import Provider from './provider';

declare var __NODE__: Boolean;

export default class App extends FusionApp {
  constructor(root: React.Element<*>, render: ?(React.Element<*>) => any) {
    const renderer = createPlugin({
      provides() {
        return (el: React.Element<*>) => {
          return prepare(el).then(() => {
            if (render) {
              return render(el);
            }
            return __NODE__ ? serverRender(el) : clientRender(el);
          });
        };
      },
      middleware() {
        return middleware;
      },
    });
    super(root, renderer);
  }
}

export {ProviderPlugin, ProvidedHOC, Provider};
