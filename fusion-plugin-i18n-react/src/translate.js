/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

function Translate(props, context) {
  return (
    <span>
      {(context.i18n && context.i18n.translate(props.id, props.data)) ||
        props.id}
    </span>
  );
}

Translate.contextTypes = {
  i18n: PropTypes.object,
};

export {Translate};
