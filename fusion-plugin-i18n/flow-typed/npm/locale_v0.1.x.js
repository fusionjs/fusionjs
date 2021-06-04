// @flow
// flow-typed signature: b7acef03f8892580bffbc05cecdc28d6
// flow-typed version: c6154227d1/locale_v0.1.x/flow_>=v0.74.x <=v0.103.x

declare module 'locale' {
  /* Type Helpers */
  declare type ObjectMap<TProp, TVal> = {[TProp]: TVal};

  declare class Locale {
    constructor(str: string): Locale;

    code: string;
    language: string;
    country: string;
    normalized: string;
    score?: number;
    defaulted?: boolean;

    toString: () => string;
    toJSON: () => string;
  }

  declare class Locales {
    @@iterator(): Iterator<Locale>;
    [key: number]: Locale;

    constructor(str: string[] | string, def?: string): Locales;

    default?: Locale;

    length: number;
    index: () => ObjectMap<string, number>;

    best: (supported?: Locales) => Locale;

    sort: Function;
    push: Function;

    toString: () => string;
    toJSON: () => Object;
  }
}
