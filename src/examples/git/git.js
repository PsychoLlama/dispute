#!/usr/bin/env node
// @flow
import { createCli } from '../../dispute';
import pkg from '../../../package';

import commit from './commit';
import diff from './diff';

const cli = createCli({
  commandName: 'git',
  packageJson: pkg,
  cli: {
    subCommands: {
      commit,
      diff,
    },
  },
});

// Or, to run the CLI against process.argv, do:
// cli.execute()
export default cli.createTestInterface();
