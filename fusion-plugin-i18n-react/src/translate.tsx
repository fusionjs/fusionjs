/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';

import {I18nContext} from './plugin';

type TranslatePropsType = {
  id: string;
  data?: any;
};

function Translate(props: TranslatePropsType) {
  const i18n = React.useContext(I18nContext);
  const content =
    (i18n && i18n.translate && i18n.translate(props.id, props.data)) ||
    props.id;
  return React.Fragment ? <>{content}</> : <span>{content}</span>;
}

export {Translate};
