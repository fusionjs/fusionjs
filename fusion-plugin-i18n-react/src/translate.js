// @flow

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
