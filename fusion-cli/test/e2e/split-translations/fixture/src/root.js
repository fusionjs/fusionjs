// @noflow

import React from 'react';
import Router, {Route, Switch, Link} from 'fusion-plugin-react-router';
import {Translate} from 'fusion-plugin-i18n-react';
import HOCTranslations from './hocTranslation.js'; 
import HookTranslations from './hookTranslation.js';

import routes from './routes';

export default function Root() {
  return (
    <div>
      <Translate id="main" />
      <HOCTranslations/>
      <HookTranslations/>
      <Link id="split1-link" to="/split1">
        go to /split1 route
      </Link>
      <Link id="split2-link" to="/split2">
        go to /split2 route
      </Link>
      <Switch>
        {routes.map(({path, ...props}) => (
          <Route key={path} path={path} {...props} />
        ))}
      </Switch>
    </div>
  );
}
