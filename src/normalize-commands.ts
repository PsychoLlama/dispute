// @flow
import assert from 'minimalistic-assert';

import parseCommandUsage, { Argument } from './parser/command-usage-parser';
import parseOptionUsage, { Usage } from './parser/option-usage-parser';
import * as parseOption from './parse-value';

// The best options type signature I can offer is `Object`.
// I've tried to get clever with `$ObjMap<$Call<...>>` and
// wasted way too much time. If the user wants typed options,
// they'll need to define it themselves.
type Command = (options: Object, ...args: string[]) => mixed;

type CommandOption = {
  parseValue?: ParseValue,
  description?: string,
};

// I really wish Flow could infer the return value.
type ParseValue = parseOption.OptionArgument => mixed;

type Subcommands<Subcommand> = {
  [commandName: string]: Subcommand,
};

type CommandOptions<ParseValue extends Object> = {
  [optionName: string]: CommandOption & ParseValue,
};

// Loose type. Allows undefined fields.
type CommandOptionsLoose = CommandOptions<{
  parseValue?: ParseValue,
  description?: string,
  usage: string,
}>;

export type CommandConfig = {
  subCommands?: Subcommands<CommandConfig>,
  options?: CommandOptionsLoose,
  description?: string,
  command?: Command,
  args?: string,
};

// Strict type. All fields must have defaults.
type CommandOptionsStrict = CommandOptions<{
  description: string | null,
  parseValue: ParseValue,
  optionName: string,
  usage: Usage,
}>;

export type CommandTree = {
  subCommands: Subcommands<CommandTree>,
  options: CommandOptionsStrict,
  description: string | null,
  parent: CommandTree | null,
  command?: Command,
  args: Argument[],
  name: string,
};

/**
 * Recursively parse, validate, and provide defaults for all commands.
 */
export default function normalizeCommands(
  config: CommandConfig,
  metadata: {
    parent?: CommandTree | null,
    commandPath?: string[],
    name?: string,
  } = {}
): CommandTree {
  const { parent = null, commandPath = [], name = 'unit-test' } = metadata;
  const {
    description = null,
    subCommands = {},
    options = {},
    args = '',
    command,
  } = config;

  // A tiny bit of validation.
  if (!command) {
    assert(
      !args,
      `Arguments were defined for a command that doesn't exist.` +
        generateFieldTrace(commandPath, 'args')
    );

    assert(
      !config.options,
      `Options were defined for a command that doesn't exist.` +
        generateFieldTrace(commandPath, 'options')
    );

    assert(
      config.command || Object.keys(subCommands).length,
      `CLI needs an implementation.\n` +
        `Add a command(...) function or subCommands: {...}.` +
        generateFieldTrace(commandPath)
    );
  }

  const normalizedCommand = {};
  Object.assign(normalizedCommand, {
    args: parseCommandUsage(args),
    description,
    command,
    parent,
    name,
  });

  normalizedCommand.subCommands = normalizeSubcommands({
    parent: normalizedCommand,
    commands: subCommands,
    commandPath,
  });

  normalizedCommand.options = normalizeOptions({
    commandPath,
    options,
  });

  enforceOptionUniqueness({ options: normalizedCommand.options, commandPath });

  return normalizedCommand;
}

// Return a string like 'config.subCommands.init.options'.
const describeConfigPath = (commandPath: string[]) => {
  const commandNamePrefix = commandPath.length
    ? 'config.cli.subCommands.'
    : 'config.cli';

  return `${commandNamePrefix}${commandPath.join('.subCommands.')}`;
};

const generateFieldTrace = (commandPath: string[], field?: string) => {
  const commandName = describeConfigPath(commandPath);
  const property = field ? `.${field}` : '';

  return `\n  At: ${commandName}${property}`;
};

// Recursively apply normalizeConfig(...) to each subcommand.
const normalizeSubcommands = ({
  commandPath,
  commands,
  parent,
}: {
  commands: Subcommands<CommandConfig>,
  commandPath: string[],
  parent: CommandTree,
}): Subcommands<CommandTree> => {
  const commandNames = Object.keys(commands);

  return commandNames.reduce((subCommands, commandName) => {
    const command = commands[commandName];
    const path = commandPath.concat(commandName);
    subCommands[commandName] = normalizeCommands(command, {
      commandPath: path,
      name: commandName,
      parent,
    });

    return subCommands;
  }, {});
};

// Add defaults to every option.
export const normalizeOptions = ({
  options,
  commandPath,
}: {
  options: CommandOptionsLoose,
  commandPath: string[],
}): CommandOptionsStrict => {
  const optionNames = Object.keys(options);
  return optionNames.reduce((commandOptions, optionName) => {
    const {
      parseValue = parseOption.asString,
      description = null,
      usage,
    } = options[optionName];

    assert(
      usage,
      `An option is missing the required '.usage' field.` +
        generateFieldTrace(commandPath, `options.${optionName}`)
    );

    commandOptions[optionName] = {
      usage: parseOptionUsage(usage),
      description,
      parseValue,
      optionName,
    };

    return commandOptions;
  }, {});
};

const enforceOptionUniqueness = ({
  commandPath,
  options,
}: {
  options: CommandOptionsStrict,
  commandPath: string[],
}) => {
  const flags = new Map();

  const assertUniqueFlag = (optionName: string, flagName: string, prefix: string) => {
    if (!flags.has(flagName)) return;
    const otherOptionName = flags.get(flagName);

    throw new Error(
      `The "${prefix + flagName}" flag is redefined by multiple options\n` +
        `("${optionName}" and "${otherOptionName}")` +
        generateFieldTrace(commandPath, 'options')
    );
  };

  Object.keys(options).forEach(optionName => {
    const option = options[optionName];
    const { short, long } = option.usage;

    if (short) assertUniqueFlag(optionName, short, '-');
    if (long) assertUniqueFlag(optionName, long, '--');

    flags.set(short, optionName).set(long, optionName);
  });
};
