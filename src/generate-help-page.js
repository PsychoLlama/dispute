// @flow
import indent from 'indent-string';

import type { CommandTree } from './normalize-commands';

type CommandOptions = $PropertyType<CommandTree, 'options'>;
type CommandOption = $PropertyType<CommandOptions, 'index-key'>;

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

// --option1
// --option2
// --option3
const describeOptions = (options: $PropertyType<CommandTree, 'options'>) => {
  return Object.keys(options)
    .map(option => options[option])
    .reduce((description, option, index) => {
      const newline = index ? '\n' : '';
      return description + newline + describeOptionUsage(option);
    }, '');
};

// - command1
// - command2
// - command3
export const describeSubcommands = (
  commands: $PropertyType<CommandTree, 'subCommands'>
) => {
  return Object.keys(commands)
    .sort((a, b) => (a > b ? 1 : -1))
    .reduce((subCommands, commandName, index) => {
      const newline = index ? '\n' : '';
      return `${subCommands}${newline}- ${commandName}`;
    }, '');
};

export default function generateHelpPage(command: CommandTree) {
  const summary = {
    subCommands: describeSubcommands(command.subCommands),
    options: describeOptions(command.options),
  };

  const commandUsage = describeCommandUsage(command);
  const optionsUsage = summary.options
    ? `\n\nOptions:\n${indent(summary.options, 2)}`
    : '';

  const subcommandUsage = summary.subCommands
    ? `\n\nCommands:\n${indent(summary.subCommands, 2)}`
    : '';

  const helpOutput = commandUsage + optionsUsage + subcommandUsage;

  return `\n${indent(helpOutput, 2)}\n`;
}
