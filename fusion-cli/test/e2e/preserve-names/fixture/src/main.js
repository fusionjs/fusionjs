// @noflow
import App from 'fusion-core';

class MyCoolClass {

}

function myCoolFunction() {

}

if (__BROWSER__) {
  window.__my_class_name__ = MyCoolClass.name;
  window.__my_fn_name__ = myCoolFunction.name;
}

export default async function() {
  const app = new App("element", el => el);
  return app;
}
