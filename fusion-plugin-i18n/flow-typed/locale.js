/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare module 'locale' {
  declare class Locale {
    constructor(str: string): Locale;

    code: string;
    language: string;
    country: string;
    normalized: string;
    score: number;
    defaulted: boolean;

    serialize: Function;
    toString: Function;
    toJSON: Function;
  }

  declare class Locales {
    constructor(str: string[] | string, def?: string): Locales;

    length: number;
    _index: any;
    index: Function;

    best: (locales: Locales) => Locale;

    sort: Function;
    push: Function;

    serialize: Function;
    toString: Function;
    toJSON: Function;
  }
}
