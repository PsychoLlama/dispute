// @flow
import type { CommandTree } from './normalize-commands';

type CommandOptions = $PropertyType<CommandTree, 'options'>;
type CommandOption = $PropertyType<CommandOptions, 'index-key'>;

export const indent = (offset: number, content: string) => {
  const indentLevel = Array(offset)
    .fill(' ')
    .join('');

  const lines = content.split('\n').map(line => indentLevel + line);
  return lines.join('\n');
};

// ['cmd', 'sub', 'command']
const getCommandPath = (command: CommandTree) => {
  const path = [command.name];
  let parent = command;

  while ((parent = parent.parent)) {
    path.unshift(parent.name);
  }

  return path;
};

// "Usage: cmd run <arg1> [arg2]"
export const describeCommandUsage = (command: CommandTree) => {
  const args = command.args.map(arg => arg.raw).join(' ');
  const spacing = command.args.length ? ' ' : '';
  const commandPath = getCommandPath(command).join(' ');

  return `Usage: ${commandPath}${spacing}${args}`;
};

const describeOptionArg = ({ required, name }) =>
  required ? `<${name}>` : `[${name}]`;

// "-o, --option <arg>"
export const describeOptionUsage = ({ usage }: CommandOption) => {
  const short = usage.short ? `-${usage.short}` : '';
  const long = usage.long ? `--${usage.long}` : '';
  const delimiter = short && long ? ', ' : '';
  const arg = usage.argument ? ' ' + describeOptionArg(usage.argument) : '';

  return `${short}${delimiter}${long}${arg}`;
};

export default function generateHelpPage(command: CommandTree) {
  const commandUsage = describeCommandUsage(command);
  const options = Object.keys(command.options)
    .map(option => command.options[option])
    .reduce((description, option, index) => {
      const newline = index ? '\n' : '';
      return description + newline + describeOptionUsage(option);
    }, '');

  const optionsUsage = options ? `\n\nOptions:\n\n${indent(2, options)}` : '';

  return `${commandUsage}${optionsUsage}`;
}
