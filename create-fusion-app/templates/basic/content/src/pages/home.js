// @flow
import React from 'react';
import {styled} from 'fusion-plugin-styletron-react';

const Center = styled('div', {
  fontFamily: 'HelveticaNeue-Light, Arial',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
});

const FusionStyle = styled('div', {
  fontSize: '80px',
  color: 'rgba(0,0,0,.8)',
  paddingRight: '30px',
  display: 'flex',
});

const FullHeightDiv = styled('div', {
  height: '100%',
  backgroundColor: '#FFFFFF',
});

const Circle = styled('div', {
  height: '180px',
  width: '180px',
  marginTop: '20px',
  backgroundColor: 'white',
  ':hover': {backgroundColor: '#f0f8fa'},
  border: '10px solid #4db5d9',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const GettingStartedLink = styled('a', {
  textDecoration: 'none',
  color: '#4db5d9',
  fontSize: '18px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  height: '100%',
});

const Home = () => (
  <FullHeightDiv>
    <style>
      {`
        html,body,#root{height:100%;}
        html{font-family:sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:rgba(0,0,0,0);}
        body{margin:0;}
        button::-moz-focus-inner,input::-moz-focus-inner{border:0;padding:0;}
        input::-webkit-inner-spin-button,input::-webkit-outer-spin-button,input::-webkit-search-cancel-button,input::-webkit-search-decoration,input::-webkit-search-results-button,input::-webkit-search-results-decoration{display:none;}
        `}
    </style>
    <Center>
      <FusionStyle>Fusion.js</FusionStyle>

      <Center>
        <Circle>
          <GettingStartedLink href="https://fusionjs.com/docs/getting-started">
            Let&apos;s Get Started
          </GettingStartedLink>
        </Circle>
      </Center>
    </Center>
  </FullHeightDiv>
);

export default Home;
