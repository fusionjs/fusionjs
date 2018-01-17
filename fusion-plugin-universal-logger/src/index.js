import ServerLogger from './server.js';
import BrowserLogger from './browser.js';

const UniversalLogger = __BROWSER__ ? BrowserLogger : ServerLogger;

export default UniversalLogger;

export {UniversalLoggerConfigToken} from './tokens';
