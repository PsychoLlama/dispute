// @flow
import type { CommandTree } from '../normalize-commands';

type CommandOptions = $PropertyType<CommandTree, 'options'>;
type CommandOption = $PropertyType<CommandOptions, 'index-key'>;

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
export const describeOptions = (options: CommandOptions) => {
  return Object.keys(options)
    .map(option => options[option])
    .reduce((description, option, index) => {
      const newline = index ? '\n' : '';
      return description + newline + describeOptionUsage(option);
    }, '');
};
