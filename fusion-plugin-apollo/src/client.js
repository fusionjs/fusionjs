/* eslint-env browser */
import ReactDOM from 'react-dom';

export default root => {
  const domElement = document.getElementById('root');
  ReactDOM.hydrate
    ? ReactDOM.hydrate(root, domElement)
    : ReactDOM.render(root, domElement);
};
