// @flow
import type { CommandTree } from './normalize-config';

export const ArgTypes = {
  Optional: 'optional',
  Required: 'required',
  None: 'none',
};

// Safer `string.match(...)`. Returns the list of matching groups.
const matchPattern = (text: string, pattern: RegExp) => {
  const matches = text.match(pattern) || [];

  return matches.slice(1);
};

// Remove the pattern from the string after a match.
const matchAndReplace = (text: string, pattern: RegExp) => ({
  matches: matchPattern(text, pattern),
  text: text.replace(pattern, ''),
});

// Apply a series of patterns against a string, each time removing the match
// so later patterns can't use it. Only supports one group per pattern.
const extractPatternsInSequence = (text: string, patterns: RegExp[]) => {
  const { results } = patterns.reduce(
    (acc, pattern) => {
      const { matches, text } = matchAndReplace(acc.text, pattern);
      const results = acc.results.concat(matches[0]);
      return { text, results };
    },
    { text, results: [] }
  );

  return results;
};

export const parseOptionUsage = (usage: string) => {
  const [
    fullName,
    shortName,
    requiredArg,
    optionalArg,
  ] = extractPatternsInSequence(usage, [
    /--(\w+)/,
    /-(\d+|\w)/,
    /<(.*?)>/,
    /\[(.*?)\]/,
  ]);

  const argType = requiredArg
    ? ArgTypes.Required
    : optionalArg
      ? ArgTypes.Optional
      : ArgTypes.None;

  return { shortName, fullName, argType };
};

const indexOptions = options => {
  const shortNames = new Map();
  const fullNames = new Map();

  for (const optionName of Object.keys(options)) {
    const { usage } = options[optionName];
    const { shortName, fullName, argType } = parseOptionUsage(usage);
    const optionProperties = { optionName, argType };
    shortNames.set(shortName, optionProperties);
    fullNames.set(fullName, optionProperties);
  }

  return { shortNames, fullNames };
};

type ParsedOutput = {
  options: { [optionName: string]: mixed },
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
export default function parse(
  command: CommandTree,
  argv: string[]
): ParsedOutput {
  const { shortNames } = indexOptions(command.options);

  const options = argv.reduce((options, arg) => {
    const flag = arg.replace(/-/g, '');
    const option = shortNames.get(flag);

    if (option) {
      options[option.optionName] = true;
    }

    return options;
  }, {});

  return {
    options,
    args: [],
  };
}
