/* eslint-env node */

const fmt = number => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Analyze individual file dependencies.
 */
module.exports = function analyzeIndividuals(sizes, length) {
  const totalSize = Object.keys(sizes).reduce(
    (sum, file) => sum + sizes[file].size,
    0
  );

  /* eslint-disable no-console */
  console.log(`Total minified size: ${fmt(totalSize)} bytes`);
  console.log('---------------\n');

  console.log('Top Individual Files by size');
  console.log('---------------------------');
  const sorted = Object.keys(sizes)
    .map(file => {
      return {file, size: sizes[file].size};
    })
    .sort((a, b) => {
      return b.size - a.size;
    });

  Object.keys(sorted)
    .filter((entry, index) => index < length)
    .forEach(index => {
      console.log(`${fmt(sorted[index].size)} bytes: ${sorted[index].file}`);
    });
  console.log('\n');
  /* eslint-enable no-console */
};
