import assert from 'minimalistic-assert';
import chalk from 'chalk';

import normalizeCommands, {
  CommandTree,
  CommandConfig,
} from './normalize-commands';
import { FatalError } from './error-utils';

// Right now `version` is the only thing dispute depends
// on. In the future it could be expanded to show
// "bugs.url" on unhandled errors, print the license
// & homepage in `help`, detect manpages, etc.
interface PkgJson {
  version: string;
}

export interface Config {
  packageJson: PkgJson;
  commandName: string;
  cli?: CommandConfig;
}

export interface NormalizedConfig {
  packageJson: PkgJson;
  cli: CommandTree;
}

const defaultCliImplementation = {
  command() {
    throw new FatalError('Define `config.cli` to start building your CLI.');
  },
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

  const commands: CommandTree = normalizeCommands(
    cli || defaultCliImplementation,
    { name: commandName }
  );

  return {
    cli: commands,
    packageJson,
  };
}
