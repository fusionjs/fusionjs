// @noflow

import React from 'react';
import {withTranslations} from 'fusion-plugin-i18n-react';

function Component({translate}) {
  return (
    <div id="with-translation">
        {translate('translations.hoc')}
    </div>
  );
}

export default withTranslations(['translations.hoc'])(Component);
