// @noflow
import {createPlugin} from 'fusion-core';

export default createPlugin({
  middleware(deps) {
    // This should transpile
    return async (ctx, next) => {
      return {
        window,
      }
    };
  },
});
