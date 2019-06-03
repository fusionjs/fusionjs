// @noflow

import React from 'react';
import {useTranslations} from 'fusion-plugin-i18n-react';

export default () => {
  const translate = useTranslations(['pattern.*', 'translations.hook']);
  /*
  useTranslations(['pattern.*', 'translations.hook']);
  const translate = useTranslations();
  */
  /*
  useTranslations(['pattern.*', 'translations.hook']);
  const {translate} = useService(I18nToken).from(React.useContext(FusionContext));
  */
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
