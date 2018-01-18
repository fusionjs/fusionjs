// @flow

// Helpers
export function createToken(name: string): any {
  // $FlowFixMe
  return () => {
    throw new Error(`Missing required value for token: ${name}.`);
  };
}

export function createOptionalToken<Default>(
  name: string,
  defaultValue: Default
): Default {
  // $FlowFixMe
  return () => defaultValue;
}

// Tokens
type Fetch = (
  input: string | Request,
  init?: RequestOptions
) => Promise<Response>;
export const FetchToken: Fetch = (createToken('FetchToken'): any);

type Session = {
  from(
    ctx: Object
  ): {
    get(keyPath: string): any,
    set(keyPath: string, val: any): void,
  },
};
export const SessionToken: Session = (createToken('SessionToken'): any);

type Logger = {
  log(level: string, arg: any): void,
  error(arg: any): void,
  warn(arg: any): void,
  info(arg: any): void,
  verbose(arg: any): void,
  debug(arg: any): void,
  silly(arg: any): void,
};
export const LoggerToken: Logger = (createToken('LoggerToken'): any);
