// @flow
import assert from 'minimalistic-assert';
import chalk from 'chalk';

import normalizeCommands, {
  type CommandTree,
  type CommandConfig,
} from './normalize-commands';

// Right now `version` is the only thing dispute depends
// on. In the future it could be expanded to show
// "bugs.url" on unhandled errors, print the license
// & homepage in `help`, detect manpages, etc.
type PkgJson = {
  version: string,
};

export type Config = {
  packageJson: PkgJson,
  commandName: string,
  cli?: CommandConfig,
};

export type NormalizedConfig = {
  packageJson: PkgJson,
  cli: CommandTree,
};

/**
 * Validate, index, and add defaults for the config object.
 */
export default function normalizeConfig({
  commandName,
  packageJson,
  cli,
}: Config): NormalizedConfig {
  assert(
    commandName,
    `Missing ${chalk.red('config.commandName')}. What is your CLI named?`
  );

  assert(
    packageJson,
    `Missing ${chalk.red(
      'config.packageJson'
    )}. Import your package.json and add it here.`
  );

  const commands: CommandTree = normalizeCommands(cli || {}, {
    name: commandName,
  });

  return {
    cli: commands,
    packageJson,
  };
}
