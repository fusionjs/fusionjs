import React from 'react';
import App from 'fusion-react';
import Styletron, {styled} from '../../..';

const StyledComponent = styled('div', (props) => ({color: props.$color}));

function Root() {
  const [color, setColor] = React.useState('red');

  const toggleColor = () => setColor(color === 'red' ? 'blue' : 'red');

  return (
    <div>
      <StyledComponent id="styled" $color={color}>
        {color}
      </StyledComponent>
      <button id="toggle" onClick={toggleColor}>
        toggle color
      </button>
    </div>
  );
}

export default () => {
  const app = new App(<Root />);
  app.register(Styletron);
  return app;
};
