import indent from 'indent-string';

import describeCommandUsage, { getCommandPath } from './command';
import { CommandTree } from '../normalize-commands';
import describeSubCommands from './sub-commands';
import { describeOptions } from './options';

const hasSubCommands = (command: CommandTree) =>
  Object.keys(command.subCommands).length > 0;

export default function generateHelpPage(command: CommandTree) {
  const summary = {
    subCommands: describeSubCommands(command.subCommands),
    options: describeOptions(command.options),
  };

  const commandUsage = describeCommandUsage(command);
  const optionsUsage = summary.options
    ? `\n\nOptions:\n${indent(summary.options, 2)}`
    : '';

  const subcommandUsage = summary.subCommands
    ? `\n\nCommands:\n${indent(summary.subCommands, 2)}`
    : '';

  const commandPath = getCommandPath(command).join(' ');
  const moreHelp = `'${commandPath} COMMAND --help'`;
  const subCommandHelp = hasSubCommands(command)
    ? `\n\nRun ${moreHelp} for more information on a command.`
    : '\n';

  const helpOutput =
    commandUsage + optionsUsage + subcommandUsage + subCommandHelp;

  return helpOutput;
}
