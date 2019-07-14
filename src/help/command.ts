// @flow
import { CommandTree } from '../normalize-commands';

// ['cmd', 'sub', 'command']
export const getCommandPath = (command: CommandTree) => {
  const path = [command.name];
  let parent: CommandTree | null = command;

  while ((parent = parent.parent)) {
    path.unshift(parent.name);
  }

  return path;
};

// "Usage: cmd run <arg1> [arg2]"
export default function describeCommandUsage(command: CommandTree) {
  const description = command.description ? `\n\n${command.description}` : '';
  const commandPath = getCommandPath(command).join(' ');

  // Not a command, just a container for sub-commands.
  if (!command.command) {
    return `Usage: ${commandPath} COMMAND${description}`;
  }

  const args = command.args.map(arg => arg.raw).join(' ');
  const spacing = command.args.length ? ' ' : '';
  const usage = commandPath + spacing + args + description;

  return `Usage: ${usage}`;
}
