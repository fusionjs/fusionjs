import serverPlugin from './node';
import clientPlugin from './browser';

export default (__NODE__ ? serverPlugin : clientPlugin);
