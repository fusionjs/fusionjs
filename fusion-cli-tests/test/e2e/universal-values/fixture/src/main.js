// @noflow
import App, {createToken, withUniversalValue, withRenderSetup, unstable_withPrepareEffect} from 'fusion-core';

export default async function () {
  const app = new App('element', (el) => el);
  app.register(TestPlugin1);
  app.register(TestPlugin2);
  app.register(TestPlugin3);
  return app;
}


function* TestPlugin1() {
    const [serialize, hydrate] = withUniversalValue("__ID_1__");
    if (__NODE__) {
      serialize(process.env.SOME_ENV_VAR1);
    }

    if (__BROWSER__) {
      const hydrated = hydrate();
       const el = document.createElement("div");
       el.id = "result1";
       el.appendChild(document.createTextNode(hydrated));
       document.body.appendChild(el);
    }
  }
  // Hack until syntax transform exposed
TestPlugin1.__fplugin__ = true;


function* TestPlugin2() {
    const [serialize, hydrate] = withUniversalValue("__ID_2__");
    if (__NODE__) {
      serialize(process.env.SOME_ENV_VAR2);
    }

    if (__BROWSER__) {
      const hydrated = hydrate();
       const el = document.createElement("div");
       el.id = "result2";
       el.appendChild(document.createTextNode(hydrated));
       document.body.appendChild(el);
    }
  }
  // Hack until syntax transform exposed
TestPlugin2.__fplugin__ = true;


function* TestPlugin3() {
    const [serialize, hydrate] = withUniversalValue("__ID_3__");

    withRenderSetup(() => {
      if (__NODE__) {
        unstable_withPrepareEffect(() => {
          serialize("baz");
        });
      }
    });

    if (__BROWSER__) {
      const hydrated = hydrate();
       const el = document.createElement("div");
       el.id = "result3";
       el.appendChild(document.createTextNode(hydrated));
       document.body.appendChild(el);
    }
  }
  // Hack until syntax transform exposed
TestPlugin3.__fplugin__ = true;
