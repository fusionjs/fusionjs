/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';

import i18n from 'fusion-plugin-i18n';

type TranslatePropsType = {
  id: string,
  data?: Object,
};

type TranslateContextType = {
  i18n?: typeof i18n.provides,
};

function Translate(props: TranslatePropsType, context: TranslateContextType) {
  const content =
    (context.i18n && context.i18n.translate(props.id, props.data)) || props.id;
  return React.Fragment ? <>{content}</> : <span>{content}</span>;
}

Translate.contextTypes = {
  i18n: PropTypes.object,
};

export {Translate};
