/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const injectDeclarationCompatMixin = (Base: any) =>
  class extends Base {
    injectDeclaration({prop, val, media, pseudo}: any) {
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
