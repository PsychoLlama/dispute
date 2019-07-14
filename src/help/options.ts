// @flow
import { sortAlphabetically, padStringMatchingLongest } from './utils';
import { CommandTree } from '../normalize-commands';

type CommandOptions = CommandTree['options'];
type CommandOption = CommandOptions['index-key'];

const getOptionSortableName = (option: CommandOption): string => {
  const name = option.usage.long || option.usage.short;
  return name as string;
};

const sortOptionsAlphabetically = (
  option1: CommandOption,
  option2: CommandOption
) => {
  const option1Name = getOptionSortableName(option1);
  const option2Name = getOptionSortableName(option2);
  return sortAlphabetically(option1Name, option2Name);
};

const describeOptionArg = ({ required, name }) =>
  required ? `<${name}>` : `[${name}]`;

const formatShortFlag = ({ usage }: CommandOption) => {
  const flag = usage.short ? `-${usage.short}` : '';

  return usage.short && usage.long ? `${flag}, ` : flag;
};

const formatLongFlag = ({ usage }: CommandOption) => {
  const flag = usage.long ? `--${usage.long}` : '';
  const arg = usage.argument ? ' ' + describeOptionArg(usage.argument) : '';
  return flag + arg;
};

// -o,    --option1
//        --option2
// -1337, --option3
export const describeOptions = (options: CommandOptions) => {
  const sortedOptions = Object.keys(options)
    .map(option => options[option])
    .sort(sortOptionsAlphabetically);

  const shortFlags = sortedOptions.map(formatShortFlag);
  const padShortFlag = padStringMatchingLongest(shortFlags);

  const longFlags = sortedOptions.map(formatLongFlag);
  const padLongFlag = padStringMatchingLongest(longFlags, {
    extraWhitespace: 3,
  });

  return sortedOptions
    .map((option, index) => {
      const short = padShortFlag(shortFlags[index]);
      const long = padLongFlag(longFlags[index]);
      const description = option.description || '';

      return short + long + description;
    })
    .join('\n');
};
