// @noflow
import App from 'fusion-core';

export default async function() {
    const e: string = 'element'

    const app = new App(e, el => el);
    return app;
}
