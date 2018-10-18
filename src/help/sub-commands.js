// @flow
import type { CommandTree } from '../normalize-commands';

// - command1
// - command2
// - command3
export default function describeSubCommands(
  commands: $PropertyType<CommandTree, 'subCommands'>
) {
  return Object.keys(commands)
    .sort((a, b) => (a > b ? 1 : -1))
    .reduce((subCommands, commandName, index) => {
      const newline = index ? '\n' : '';
      return `${subCommands}${newline}- ${commandName}`;
    }, '');
}
