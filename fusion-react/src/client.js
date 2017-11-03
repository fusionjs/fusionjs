/* eslint-env browser */
import ReactDOM from 'react-dom';

export default el => {
  const domElement = document.getElementById('root');
  ReactDOM.hydrate
    ? ReactDOM.hydrate(el, domElement)
    : ReactDOM.render(el, domElement);
};
