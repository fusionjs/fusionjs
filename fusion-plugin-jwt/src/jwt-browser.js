import {Plugin} from 'fusion-core';

export default function({secret} = {}) {
  if (__DEV__ && secret) {
    throw new Error(
      'Do not pass JWT session secret to the client. Try: `app.plugin(JWTSession, __NODE__ && {...})`'
    );
  }
  class Service {
    constructor() {
      throw new Error('Cannot instantiate JWT service in the browser');
    }
  }
  return new Plugin({Service});
}
