// @flow
import indent from 'indent-string';

import type { CommandTree } from '../normalize-commands';
import describeSubCommands from './sub-commands';
import describeCommandUsage from './command';
import { describeOptions } from './options';

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

  const helpOutput = commandUsage + optionsUsage + subcommandUsage;

  return `\n${indent(helpOutput, 2)}\n`;
}
