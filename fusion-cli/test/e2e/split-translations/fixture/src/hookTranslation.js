// @noflow

import React from 'react';
import {useTranslations} from 'fusion-plugin-i18n-react';

export default () => {
  const translate = useTranslations();
  return (
    <div id="hook-translation">
      <p>
        {translate('translations.hook')}
      </p>
      <p>
        {translate(`pattern.${'def'}`)}
      </p>
    </div>
  );
}
