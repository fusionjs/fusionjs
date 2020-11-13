/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function captureStackTrace(caller: Function): string {
  // For monitoring in production, use a single format independent of browser
  if (__BROWSER__ && !__DEV__) {
    return new Error().stack;
  } else {
    if ('captureStackTrace' in Error) {
      const err = {};
      Error.captureStackTrace(err, caller);
      return err.stack;
    } else {
      return new Error().stack;
    }
  }
}

export class DIError extends Error {
  link: ?string;
  constructor({
    message,
    errorDoc,
    caller,
    stack,
  }: {
    message: string,
    errorDoc?: string,
    caller?: Function,
    stack?: string,
  }) {
    super(message);
    if (errorDoc) {
      this.link = `https://github.com/fusionjs/fusionjs/tree/master/errors/${errorDoc}.md`;
    }
    if (__NODE__ || __DEV__) {
      if (caller && 'captureStackTrace' in Error) {
        Error.captureStackTrace(this, caller);
      }
    }
    if (stack) {
      // Replace the DIError stack trace with the supplied stack
      // Assumes `message` contains no new lines
      const diErrorMessage = this.stack.split('\n')[0];
      const stackOverride = stack.split('\n');
      stackOverride[0] = diErrorMessage;
      this.stack = stackOverride.join('\n');
    }
  }
}
