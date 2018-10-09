// @flow
import assert from 'minimalistic-assert';

import parseCommandUsage, {
  type Argument,
} from './parser/command-usage-parser';
import parseOptionUsage, { type Usage } from './parser/option-usage-parser';
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

type CommandOptions<ParseValue: Object> = {
  [optionName: string]: CommandOption & ParseValue,
};

// Loose type. Allows undefined fields.
type CommandOptionsLoose = CommandOptions<{
  parseValue?: ParseValue,
  usage: string,
}>;

export type CommandConfig = {
  subCommands?: Subcommands<CommandConfig>,
  options?: CommandOptionsLoose,
  command?: Command,
  args?: string,
};

// Strict type. All fields must have defaults.
type CommandOptionsStrict = CommandOptions<{
  parseValue: ParseValue,
  optionName: string,
  usage: Usage,
}>;

export type CommandTree = {
  subCommands: Subcommands<CommandTree>,
  options: CommandOptionsStrict,
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
  const { command, subCommands = {}, options = {}, args = '' } = config;
  const { parent = null, commandPath = [], name = 'unit-test' } = metadata;

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
  }

  const normalizedCommand = {};
  Object.assign(normalizedCommand, {
    args: parseCommandUsage(args),
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

  return normalizedCommand;
}

// Return a string like 'config.subCommands.init.options'.
const describeConfigPath = (commandPath: string[]) => {
  const commandNamePrefix = commandPath.length
    ? 'config.subCommands.'
    : 'config';

  return `${commandNamePrefix}${commandPath.join('.subCommands.')}`;
};

const generateFieldTrace = (commandPath: string[], field: string) => {
  const commandName = describeConfigPath(commandPath);

  return `\n  At: ${commandName}.${field}`;
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
const normalizeOptions = ({
  options,
  commandPath,
}: {
  options: CommandOptionsLoose,
  commandPath: string[],
}): CommandOptionsStrict => {
  const defaults = {
    parseValue: parseOption.asString,
  };

  const optionNames = Object.keys(options);
  return optionNames.reduce((commandOptions, optionName) => {
    const option = options[optionName];
    assert(
      option.usage,
      `An option is missing the required '.usage' field.` +
        generateFieldTrace(commandPath, `options.${optionName}`)
    );

    commandOptions[optionName] = {
      ...defaults,
      ...option,
      usage: parseOptionUsage(option.usage),
      optionName,
    };

    return commandOptions;
  }, {});
};
