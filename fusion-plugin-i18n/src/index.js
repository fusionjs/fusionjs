import serverPlugin, {I18nLoaderToken} from './node';
import clientPlugin, {HydrationStateToken} from './browser';
import createI18nLoader from './loader';
import {createToken} from 'fusion-tokens';

const I18nToken = createToken('I18nToken');

export default (__NODE__ ? serverPlugin : clientPlugin);
export {I18nToken, I18nLoaderToken, HydrationStateToken, createI18nLoader};
