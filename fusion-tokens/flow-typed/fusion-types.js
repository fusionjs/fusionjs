// @flow
declare module 'fusion-types' {
  declare export function createToken(name: string): any;
  declare export function createToken<R>(Plugin: (deps: any) => R): R;
  declare export function createOptionalToken<Default>(
    name: string,
    defaultValue: Default
  ): Default;

  // tokens
  declare export var FetchToken: (
    input: string | Request,
    init?: RequestOptions
  ) => Promise<Response>;

  declare export var SessionToken: {
    from(
      ctx: Object
    ): {
      get(keyPath: string): any,
      set(keyPath: string, val: any): void,
    },
  };

  declare export var LoggerToken: {
    log(level: string, arg: any): void,
    error(arg: any): void,
    warn(arg: any): void,
    info(arg: any): void,
    verbose(arg: any): void,
    debug(arg: any): void,
    silly(arg: any): void,
  };
}
