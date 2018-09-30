// @flow
import type { CommandTree } from './normalize-config';

export const ArgTypes = {
  Optional: 'optional',
  Required: 'required',
  None: 'none',
};

const indexOptions = options => {
  const shortNames = new Map();
  const fullNames = new Map();

  for (const optionName of Object.keys(options)) {
    const { usage } = options[optionName];
    const option = { ...usage, optionName };
    shortNames.set(usage.short, option);
    fullNames.set(usage.long, option);
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
