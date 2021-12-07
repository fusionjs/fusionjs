// @nofow
// @flow
import {memoize} from '../memoize';
import {createPlugin} from '../create-plugin';

export default createPlugin({
  provides: () => {
    return {
      from: memoize((ctx) => {
        return {
          name: 'unknown_route',
        };
      }),
    };
  },
});
