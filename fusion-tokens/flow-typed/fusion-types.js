// @flow
declare module 'fusion-types' {
  declare export function createToken(name: string): any;
  declare export function createToken<R>(Plugin: (deps: any) => R): R;
  declare export function createOptionalToken<Default>(
    name: string,
    defaultValue: Default
  ): Default;

  // tokens
  declare export var GenericSessionToken: {
    // TODO: sync this up with fusion-core types?
    from(
      ctx: Object
    ): {
      get(keyPath: string): any,
      set(keyPath: string, val: any): void,
    },
  };

  declare export var FetchToken: (
    input: string | Request,
    init?: RequestOptions
  ) => Promise<Response>;
}
