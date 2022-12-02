import React from 'react';
import App from 'fusion-react';
import Styletron, {styled, AtomicPrefixToken} from '../../../../';

const StyledComponent = styled('div', {color: 'red', background: 'blue'});

function Root() {
  return (
    <div>
      <StyledComponent id="styled">Hello world</StyledComponent>
    </div>
  );
}

export default () => {
  const app = new App(<Root />);
  app.register(Styletron);
  app.register(AtomicPrefixToken, '__atomic_prefix__');
  return app;
};
