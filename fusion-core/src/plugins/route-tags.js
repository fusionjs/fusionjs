// @flow
import {memoize} from '../memoize';
import {createPlugin} from '../create-plugin';
import type {RouteTagsType} from '../types';

export default createPlugin<{}, RouteTagsType>({
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
