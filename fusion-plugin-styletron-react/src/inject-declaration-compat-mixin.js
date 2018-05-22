/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// $FlowFixMe
export const injectDeclarationCompatMixin = Base =>
  class extends Base {
    // $FlowFixMe
    injectDeclaration({prop, val, media, pseudo}) {
      let style = {[prop]: val};
      if (pseudo) {
        style = {
          [pseudo]: style,
        };
      }
      if (media) {
        style = {
          [media]: style,
        };
      }
      return this.renderStyle(style);
    }
  };
