import serverCsrf from './server';
import clientCsrf from './browser';

export default (__NODE__ ? serverCsrf : clientCsrf);
