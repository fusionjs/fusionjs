// Helpers
export const createToken = name => () => {
  throw new Error(`Missing required value for token: ${name}.`);
};
export const createOptionalToken = (name, defaultValue) => () => defaultValue;

// Tokens
export const FetchToken = createToken('FetchToken');
export const LoggerToken = createToken('LoggerToken');
export const SessionToken = createToken('SessionToken');
