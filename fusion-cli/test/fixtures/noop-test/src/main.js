export default function() {
  return {
    plugins: [],
    callback() {
      console.log(`main __BROWSER__ is ${__BROWSER__}`);
      console.log(`main __DEV__ is ${__DEV__}`);
      console.log(`main __NODE__ is ${__NODE__}`);
    },
  };
}
