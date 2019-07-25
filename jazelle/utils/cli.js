// @flow
/*::
import type {Args} from './parse-argv.js';

export type Cli = (string, Args, CliOptions, CliAction) => Promise<void>;
export type CliOptions = {[string]: [string, CliAction]};
export type CliAction = (Args) => Promise<void>;
*/
const cli /*: Cli */ = async (command, args, options, fallback) => {
  if (command == null || command === '--help') {
    const keys = Object.keys(options);
    const maxWidth = Math.max(...keys.map(key => key.length));
    console.log(`\nUsage: jazelle [command]\n`);
    console.log(`Commands:`);
    keys.forEach(key => {
      // eslint-disable-next-line no-unused-vars
      const [description, ...rest] = options[key][0].split('\n');
      const space = ' '.repeat(maxWidth - key.length + 4);
      console.log(`  ${key}${space}${description}`);
    });
    console.log('');
  } else {
    if (!options[command]) {
      await fallback(args);
    } else {
      const [docs, fn] = options[command];
      if (args.help) {
        const [description, ...lines] = docs
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);
        const args = lines
          .map(line => (line.trim().match(/(.+?)\s{2,}/) || [])[1])
          .join(' ');
        const usage = `Usage: jazelle ${command} ${args}`;
        console.log(`\n${description}\n\n${usage}\n`);
        if (lines.length)
          console.log(`Args:\n${lines.map(line => `  ${line}`).join('\n')}\n`);
      } else {
        await fn(args);
      }
    }
  }
};

module.exports = {cli};
