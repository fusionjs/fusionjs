// @flow
import {createToken} from 'fusion-core';

import type {Token} from 'fusion-core';
import type {StoreEnhancer} from 'redux';

export const ConnectedRouterEnhancerToken: Token<
  StoreEnhancer<*, *, *>
> = createToken('ConnectedRouterEnhancer');
