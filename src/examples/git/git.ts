#!/usr/bin/env node
import { createCli } from '../../dispute';

import commit from './commit';
import diff from './diff';

const cli = createCli({
  commandName: 'git',
  packageJson: require('../../../package'),
  cli: {
    description: 'Distributed version control system',
    subCommands: {
      commit,
      diff,
    },
  },
});

// Or, to run the CLI against process.argv, do:
// cli.execute()
export default cli.createTestInterface();
