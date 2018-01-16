import {createToken} from 'fusion-tokens';
import serverPlugin, {I18nLoaderToken} from './node';
import clientPlugin, {HydrationStateToken} from './browser';
import createI18nLoader from './loader';

const I18nToken = createToken('I18nToken');

export default (__NODE__ ? serverPlugin : clientPlugin);
export {I18nToken, I18nLoaderToken, HydrationStateToken, createI18nLoader};
