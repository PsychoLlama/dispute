// @flow
import { sortAlphabetically, padStringMatchingLongest } from './utils';
import { CommandTree } from '../normalize-commands';

// - command            description
// - longer-command     description
// - no-description
export default function describeSubCommands(
  commands: $PropertyType<CommandTree, 'subCommands'>
) {
  const commandNames = Object.keys(commands).sort(sortAlphabetically);
  const padCommandName = padStringMatchingLongest(commandNames, {
    extraWhitespace: 5,
  });

  return commandNames
    .map(commandName => {
      const command = commands[commandName];
      const description = command.description || '';

      return `${padCommandName(command.name)}${description}`;
    })
    .join('\n');
}
