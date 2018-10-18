// @flow
import type { CommandTree } from '../normalize-commands';

// ['cmd', 'sub', 'command']
export const getCommandPath = (command: CommandTree) => {
  const path = [command.name];
  let parent = command;

  while ((parent = parent.parent)) {
    path.unshift(parent.name);
  }

  return path;
};

// "Usage: cmd run <arg1> [arg2]"
export default function describeCommandUsage(command: CommandTree) {
  const args = command.args.map(arg => arg.raw).join(' ');
  const spacing = command.args.length ? ' ' : '';
  const commandPath = getCommandPath(command).join(' ');

  return `Usage: ${commandPath}${spacing}${args}`;
}
