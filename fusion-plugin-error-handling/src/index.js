import serverPlugin from './server';
import clientPlugin from './client';

export default (__NODE__ ? serverPlugin : clientPlugin);
export {ErrorHandlerToken} from './server';
