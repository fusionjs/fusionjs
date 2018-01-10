import {compose} from 'fusion-core';

export default function simulate(app, ctx) {
  app.resolve();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
