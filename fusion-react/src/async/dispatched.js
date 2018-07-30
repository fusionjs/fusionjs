/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import PropTypes from 'prop-types';

import prepared from './prepared';

const storeShape = PropTypes.shape({
  dispatch: PropTypes.func.isRequired,
});

// $FlowFixMe
const dispatched = (prepareUsingDispatch, opts = {}) => OriginalComponent => {
  const prepare = (props, context) => {
    return prepareUsingDispatch(props, context.store.dispatch);
  };
  const contextTypes = Object.assign(
    {},
    opts && opts.contextTypes ? opts.contextTypes : {},
    {store: storeShape}
  );
  const preparedOpts = Object.assign({}, opts, {contextTypes});
  return prepared(prepare, preparedOpts)(OriginalComponent);
};

export default dispatched;
