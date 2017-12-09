// Helpers
export const createToken = name => () => {
  throw new Error(`Missing required value for token: ${name}.`);
};
export const createOptionalToken = (name, defaultValue) => () => defaultValue;

// Tokens
export const GenericSessionToken = createToken('GenericSession');
export const FetchToken = createToken('Fetch');
