// @flow
import chalk from 'chalk';

import type { CommandTree } from './normalize-config';

// Same implementation as error. The only advantage is
// the ability to distinguish it from other errors.
class ParseError extends Error {}

type Options = $PropertyType<CommandTree, 'options'>;

const indexOptions = (options: Options) => {
  const shortFlags = new Map();
  const longFlags = new Map();

  for (const optionName of Object.keys(options)) {
    const flag = options[optionName];

    shortFlags.set(flag.usage.short, flag);
    longFlags.set(flag.usage.long, flag);
  }

  return { shortFlags, longFlags };
};

const looksLikeFlag = (argument: string) => /^-/.test(argument);
const isShortFlag = (argument: string) => /^-[^-]/.test(argument);
const isNumericFlag = (argument: string) => /^-\d/.test(argument);
const isConjoinedWithValue = (argument: string) => /^--?\w+?=/.test(argument);

// Massages the argv until it's ready for consumption.
export const normalizeArgv = (argv: string[]): string[] => {
  const normalized = [];

  argv.forEach(arg => {
    if (isConjoinedWithValue(arg)) {
      const [flag, ...argumentParts] = arg.split('=');
      const argument = argumentParts.join('=');

      // It's possible the flags are part of a short group,
      // like "-cvp=8080".
      const normalizedFlags = normalizeArgv([flag]);
      return normalized.push(...normalizedFlags, argument);
    }

    // Numeric (-1337) or just a plain argument.
    if (!looksLikeFlag(arg) || isNumericFlag(arg)) {
      return normalized.push(arg);
    }

    // Explode a group of short flags (e.g. -xzvf) into
    // several independent flags (-x -z -v -f).
    if (isShortFlag(arg) && arg.length > 2) {
      const characters = arg.replace(/^-/, '').split('');
      const independentFlags = characters.map(flag => `-${flag}`);

      return normalized.push(...independentFlags);
    }

    normalized.push(arg);
  });

  return normalized;
};

// Look up the given flag in the flag index.
// Which index depends on the type.
const resolveOption = (index, arg) => {
  const flagName = arg.replace(/^--?/, '');
  const flagIndex = isShortFlag(arg) ? index.shortFlags : index.longFlags;

  return flagIndex.get(flagName);
};

const parseOption = ({ flag, option, argument }) => {
  // If it doesn't accept an argument it must be boolean.
  if (!option.usage.argument) {
    return {
      optionConsumedArgument: false,
      optionValue: true,
    };
  }

  const optionValue = option.parseValue({
    flag,
    input: argument || '',
    createParseError(msg: string) {
      const trace = `at ${chalk.blue(flag)}`;
      const prefix = `${chalk.red('Invalid value')} ${trace}`;

      return new ParseError(`${prefix}: ${msg}`);
    },
  });

  return { optionValue, optionConsumedArgument: true };
};

const extractPossibleArgument = (argvStack: string[]): ?string => {
  const argument: ?string = argvStack[0];
  if (!argument || looksLikeFlag(argument)) return undefined;

  return argument;
};

type ParsedOutput = {
  options: { [optionName: string]: mixed },
  invalidOptions: string[],
  args: string[],
};

/**
 * Split commands arguments into two buckets:
 * - Command arguments
 * - Option flags
 * If a given option is unknown, throw an error.
 *
 * @example
 * $ cmd -p 8080 cmd-arg --color=yes
 * $ cmd variadic -qsp 3000 args -v flag:param
 */
export default function parseArgv(
  command: CommandTree,
  argv: string[]
): ParsedOutput {
  const flagIndex = indexOptions(command.options);
  const stack = normalizeArgv(argv);
  const invalidOptions = [];
  const options = {};
  const args = [];

  // The argv stack is consumed left to right.
  while (stack.length) {
    const arg = stack.shift();

    // Must be a command argument.
    if (!looksLikeFlag(arg)) {
      args.push(arg);
      continue;
    }

    // Look up the option by the flag name.
    const option = resolveOption(flagIndex, arg);

    // We were just given an invalid flag. Collect any others
    // for a more complete debugging picture.
    if (!option) {
      invalidOptions.push(arg);
      continue;
    }

    // Parse the option (and maybe argument) into a value.
    const { optionValue, optionConsumedArgument } = parseOption({
      argument: extractPossibleArgument(stack),
      flag: arg,
      option,
    });

    options[option.optionName] = optionValue;

    // Don't mistake the option's argument for a command argument.
    if (optionConsumedArgument) stack.shift();
  }

  return {
    invalidOptions,
    options,
    args,
  };
}
