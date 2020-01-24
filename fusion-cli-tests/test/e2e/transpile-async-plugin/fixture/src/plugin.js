// @noflow
import {createPlugin} from 'fusion-core';

export default createPlugin({
  middleware(deps) {
    return async (ctx, next) => {
      // This should transpile
    };
  },
});
