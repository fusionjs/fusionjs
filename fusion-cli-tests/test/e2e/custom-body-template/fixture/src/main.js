// @noflow
import App, {SSRBodyTemplateToken} from 'fusion-core';

export default async function() {
  const app = new App('element', el => el);
  // Note: cannot use app.register because fusion-cli registers this token,
  // whose registration always comes after this code code is invoked.
  app.enhance(SSRBodyTemplateToken, () => customTemplate);
  return app;
}

function customTemplate() {
  return '<div>custom template</div>';
}
