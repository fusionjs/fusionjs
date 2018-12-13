/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type App from 'fusion-core';
import path from 'path';
import process from 'process';

import type {Dep} from './cli/types.js';

const nodeOf = ({name, stacks = []}) => ({
  name,
  sources: getSources(stacks, {
    token: /create-token/,
    plugin: /create-plugin/,
  }),
});

type Token = {name: string, stacks: Array<{type: string, stack: string}>};

export const collectDependencyData = (app: App) => {
  const registered = Array.from(app.registered.values());
  const dependencies = registered.map<Dep>(({token, value}) => {
    const deps = value && value.deps ? value.deps : {};
    const type =
      value && value.__plugin__
        ? value.provides
          ? value.middleware
            ? 'both'
            : 'service'
          : value.middleware
          ? 'middleware'
          : 'noop'
        : 'value';
    return {
      ...nodeOf(token),
      type,
      dependencies: ((Object.values(deps): any): Array<Token>).map(
        ({name}) => name
      ),
    };
  });
  return {timestamp: Date.now(), dependencies};
};

const getSources = (stacks, ignore) => {
  return stacks.map(({type, stack = ''}) => {
    return {
      type,
      source: stack
        .split('\n')
        .filter(line => {
          return line.match(/\//) && !line.match(ignore[type] || /base-app/);
        })
        .map(line => line.match(/\((.*?)\)/))
        .filter(match => match && match[1])
        .map(match => ((match: any): Array<string>)[1])
        .map(to => __NODE__ ? path.relative(process.cwd(), to) : to)
        .shift(),
    };
  });
};
