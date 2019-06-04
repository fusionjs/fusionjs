const {spawn} = require('./node-helpers.js');
const {node, yarn} = require('./binary-paths.js');

async function cli(command, args, options, rest) {
  if (command == null || command === '--help') {
    const keys = Object.keys(options);
    const maxWidth = Math.max(...keys.map(key => key.length));
    console.log(`\nUsage: jazelle [command]\n`);
    console.log(`Commands:`);
    keys.forEach(key => {
      const [description, ...rest] = options[key][0].split('\n');
      const space = ' '.repeat(maxWidth - key.length + 4);
      console.log(`  ${key}${space}${description}`);
    });
    console.log('');
  } else {
    if (!options[command]) {
      await spawn(node, [yarn, command, ...rest], {env: process.env, cwd: process.cwd(), stdio: 'inherit'});
    } else {
      const [docs, fn] = options[command];
      if (args.help) {
        const [description, ...lines] = docs.split('\n').map(line => line.trim()).filter(Boolean);
        const args = lines.map(line => line.trim().match(/(.+?)\s{2,}/)[1]).join(' ');
        const usage = `Usage: jazelle ${command} ${args}`
        console.log(`\n${description}\n\n${usage}\n`);
        if (lines.length) console.log(`Args:\n${lines.map(line => `  ${line}`).join('\n')}\n`);
      } else {
        await fn(args);
      }
    }
  }
}

module.exports = {cli};