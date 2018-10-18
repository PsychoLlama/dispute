// @flow
import type { CommandTree } from '../normalize-commands';

const DESCRIPTION_CHAR_PADDING = 5;

// Add padding to command names so they all equal the same length.
// Ensures descriptions start at the same column.
const createDescriptionPadding = (commandNames: string[]) => {
  const commandNameLengths = commandNames.map(name => name.length);
  const longestCommandNameLength = Math.max(...commandNameLengths, 0);
  const paddingSize = longestCommandNameLength + DESCRIPTION_CHAR_PADDING;

  const padding = Array(paddingSize)
    .fill('')
    .join(' ');

  return (commandName: string) => {
    const endPadding = padding.slice(commandName.length);
    return commandName + endPadding;
  };
};

const sortAlphabetically = (a, b) => (a > b ? 1 : -1);

// - command            description
// - longer-command     description
// - no-description
export default function describeSubCommands(
  commands: $PropertyType<CommandTree, 'subCommands'>
) {
  const commandNames = Object.keys(commands).sort(sortAlphabetically);
  const padCommandName = createDescriptionPadding(commandNames);

  return commandNames
    .map(commandName => {
      const command = commands[commandName];
      const description = command.description || '';

      return `- ${padCommandName(command.name)} ${description}`;
    })
    .join('\n');
}
