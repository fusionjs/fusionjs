// @noflow
module.exports = function(output) {
  // Parse jest output like:
  // Test Suites: 1 failed, 1 total
  const pattern = /Test Suites:.*?, ([0-9]+) total/g;
  let match;
  let total = 0;

  do {
    match = pattern.exec(output);
    if (match) {
      total += parseInt(match[1], 10);
    }
  } while (match);
  return total;
};
