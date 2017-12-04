export default class MissingHandlerError extends Error {
  constructor(method) {
    super(`Missing RPC handler for ${method}`);
    this.code = 'ERR_MISSING_HANDLER';
    Error.captureStackTrace(this, MissingHandlerError);
  }
}
