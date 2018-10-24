/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type App from 'fusion-core';

const nodeOf = ({name, stack}) => ({name, stack});

type Token = {name: string, stack: string};

export const collectDependencyData = (app: App) => {
  const registered = Array.from(app.registered.values());
  const dependencies = registered.map(({token, value}) => {
    const deps = value && value.deps ? value.deps : {};
    return {
      ...nodeOf(token),
      dependencies: ((Object.values(deps): any): Array<Token>)
        .map(nodeOf)
        .map(t => t.name),
    };
  });

  // $FlowFixMe enhancerToToken should be defined in type FusionApp
  const enhanced = Array.from(app.enhancerToToken.values())
    .filter(t => t.name)
    .map(t => ({name: t.name}));

  return {timestamp: Date.now(), dependencies, enhanced};
};
