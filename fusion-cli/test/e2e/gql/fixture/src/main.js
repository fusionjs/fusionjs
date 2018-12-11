// @noflow
import App from 'fusion-core';
// $FlowFixMe
import {gql} from 'fusion-apollo';

const schema = gql('./schema.gql');
if (__BROWSER__) {
  window.schema = schema;
}

export default (async function() {
  const app = new App('element', el => el);
  __NODE__ &&
    app.middleware((ctx, next) => {
      if (ctx.url === '/schema') {
        ctx.body = schema;
      }
      return next();
    });

  return app;
});
