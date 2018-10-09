// @flow
import type { CommandTree } from './normalize-commands';

type CommandOptions = $PropertyType<CommandTree, 'options'>;
type CommandOption = $PropertyType<CommandOptions, 'index-key'>;

export default (command: CommandTree) => typeof command;

export const describeCommandUsage = (command: CommandTree) => {
  const args = command.args.map(arg => arg.raw).join(' ');
  const spacing = command.args.length ? ' ' : '';

  return `Usage: ${command.name}${spacing}${args}`;
};

// WIP
export const describeOptionUsage = (option: CommandOption) => {
  return `--${String(option.usage.long)}`;
};
