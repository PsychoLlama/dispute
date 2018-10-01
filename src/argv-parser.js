// @flow
import type { CommandTree } from './normalize-config';

type Options = $PropertyType<CommandTree, 'options'>;

const indexOptions = (options: Options) => {
  const shortFlags = new Map();
  const longFlags = new Map();

  for (const optionName of Object.keys(options)) {
    const { usage } = options[optionName];
    const option = { ...usage, optionName };
    shortFlags.set(usage.short, option);
    longFlags.set(usage.long, option);
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

const parseOption = () => {
  return true;
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
  const index = indexOptions(command.options);

  const { options, invalidOptions } = normalizeArgv(argv).reduce(
    ({ options, invalidOptions }, arg) => {
      const option = resolveOption(index, arg);

      if (option) {
        // TODO: actually parse the option.
        options[option.optionName] = parseOption();
      } else {
        invalidOptions.push(arg);
      }

      return { options, invalidOptions };
    },
    {
      options: {},
      invalidOptions: [],
    }
  );

  return {
    invalidOptions,
    args: [],
    options,
  };
}
