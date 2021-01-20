// @noflow
import App from 'fusion-core';
import {gql} from 'fusion-plugin-apollo';
const schema = gql('./schema.graphql');
const query = gql('./query.gql');

if (__BROWSER__) {
  window.schema = schema;
  window.query = query;
}

export default (async function() {
  const app = new App('element', el => el);
  __NODE__ &&
    app.middleware((ctx, next) => {
      if (ctx.url === '/schema') {
        ctx.body = schema;
      }
      if (ctx.url === '/query') {
        ctx.body = query;
      }
      return next();
    });

  return app;
});
