import {Plugin} from 'fusion-core';
import MissingHandlerError from './missing-handler-error';

export default ({handlers} = {}) => {
  return new Plugin({
    Service: class RPC {
      async request(method, args) {
        if (!handlers[method]) {
          throw new MissingHandlerError(method);
        }
        return handlers[method](args);
      }
    },
  });
};
