// @flow
import normalizeArgv, { looksLikeFlag, isShortFlag } from './normalize-argv';
import type { CommandTree } from './normalize-commands';
import { makeParseErrorFactory } from './error-utils';

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

// Look up the given flag in the flag index.
// Which index depends on the type.
const resolveOption = (index, arg) => {
  const flagName = arg.replace(/^--?/, '');
  const flagIndex = isShortFlag(arg) ? index.shortFlags : index.longFlags;

  return flagIndex.get(flagName);
};

const parseOption = ({ flag, option, argument }) => {
  // If it doesn't accept an argument, the option must be boolean.
  if (!option.usage.argument) {
    return {
      optionConsumedArgument: false,
      optionValue: true,
    };
  }

  // An argument was required but none was given.
  if (argument === undefined && option.usage.argument.required) {
    const requiredArgName = option.usage.argument.name;
    const createParseError = makeParseErrorFactory({
      prefix: 'Missing value',
      flag,
    });

    throw createParseError(`Expected argument <${requiredArgName}>.`);
  }

  const optionValue = option.parseValue({
    createParseError: makeParseErrorFactory({ flag }),
    input: argument || '',
    flag,
  });

  return { optionValue, optionConsumedArgument: true };
};

const extractPossibleArgument = (argvStack: string[]): ?string => {
  const argument: ?string = argvStack[0];
  if (!argument || looksLikeFlag(argument)) return undefined;

  return argument;
};

type ParsedOutput = {
  globalOptions: { [optionName: string]: mixed },
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
  globalOptions: Options,
  argv: string[]
): ParsedOutput {
  const parsed: ParsedOutput = {
    invalidOptions: [],
    globalOptions: {},
    options: {},
    args: [],
  };

  const flagIndex = indexOptions(command.options);
  const globalFlagIndex = indexOptions(globalOptions);
  const stack = normalizeArgv(argv);

  // The argv stack is consumed left to right.
  while (stack.length) {
    const arg = stack.shift();

    // Must be a command argument.
    if (!looksLikeFlag(arg)) {
      parsed.args.push(arg);
      continue;
    }

    // Look up the option by the flag name.
    const commandOption = resolveOption(flagIndex, arg);
    const globalOption = resolveOption(globalFlagIndex, arg);
    const option = commandOption || globalOption;

    // We were just given an invalid flag. Collect any others
    // for a more complete debugging picture.
    if (!option) {
      parsed.invalidOptions.push(arg);
      continue;
    }

    // Parse the option (and maybe argument) into a value.
    const { optionValue, optionConsumedArgument } = parseOption({
      argument: extractPossibleArgument(stack),
      flag: arg,
      option,
    });

    // Decide if this is a global or local option. Prefer local.
    const optionsMap = commandOption ? parsed.options : parsed.globalOptions;
    optionsMap[option.optionName] = optionValue;

    // Don't mistake the option's argument for a command argument.
    if (optionConsumedArgument) stack.shift();
  }

  return parsed;
}
