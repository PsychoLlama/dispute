// @flow
import type { CommandTree } from '../normalize-commands';
import { sortAlphabetically } from './utils';

type CommandOptions = $PropertyType<CommandTree, 'options'>;
type CommandOption = $PropertyType<CommandOptions, 'index-key'>;

const getOptionSortableName = option => {
  const name: any = option.usage.long || option.usage.short;
  return (name: string);
};

const sortOptionsAlphabetically = (option1, option2) => {
  const option1Name = getOptionSortableName(option1);
  const option2Name = getOptionSortableName(option2);
  return sortAlphabetically(option1Name, option2Name);
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

// -o, --option1
//     --option2
// -3, --option3
export const describeOptions = (options: CommandOptions) => {
  return Object.keys(options)
    .map(option => options[option])
    .sort(sortOptionsAlphabetically)
    .map(describeOptionUsage)
    .join('\n');
};
