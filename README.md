<div align="center">
  <img alt="dispute logo" src="https://cdn.jsdelivr.net/gh/PsychoLlama/dispute@744662288c29426397a73396c441a158f09150d4/static/logo.png" width="150" align="center" />
  <h1>Dispute</h1>
  <p>A tool for building command line interfaces.</p>

  <div>
    <a href="https://travis-ci.org/PsychoLlama/dispute"><img alt="Travis CI master build status" src="https://img.shields.io/travis/PsychoLlama/dispute/master.svg?style=popout-square" /></a>
    <a href="https://www.npmjs.com/package/dispute"><img alt="npm package version" src="https://img.shields.io/npm/v/dispute.svg?style=popout-square" /></a>
  </div>
</div>

## Purpose
Dispute is an alternative to [commander](https://www.npmjs.com/package/commander) and [yargs](https://www.npmjs.com/package/yargs) with a focus on testability and command composition.

## Features
- All the normal CLI stuff
- Unit testing compatibility
  - Won't crash your test runner if the CLI input is invalid
  - Won't cache flags between tests (lookin' at you, `commander`)
  - Forwards command return values (e.g. promises)
- Offers better alternatives to `process.exit(1)`
  - Rejecting with an exit code tells `dispute` to kill the process, but only outside unit tests
- Encourages a structure where commands can easily be reused in other commands
- The options object comes _before_ variadic arguments

## Example
See [the examples folder](https://github.com/PsychoLlama/dispute/tree/master/src/examples) for an idea of how dispute works in practice.

For a more immediate example, here's how you might structure `git remote`:

```js
import { createCli, parseValue } from 'dispute'
import pkg from '../package.json';

// $ git remote add <name> <url>
const add = {
  args: '<remote-name> <remote-url>',
  command(options, remoteName, remoteUrl) {
    // Implementation
  },
};

// $ git remote
const remote = {
  subCommands: { add },

  options: {
    verbose: { usage: '-v, --verbose' },
  },

  command({ verbose = false }) {
    // Implementation
  },
};

// $ git
const cli = createCli({
  commandName: 'git',
  packageJson: pkg,
  cli: {
    subCommands: {
      remote,
      // diff,
      // commit,
      // checkout,
      // branch,
      // ...
    },
  },
})

cli.execute().then(() => {
  console.log('Command finished running!')
})
```

Until I write better documentation, I'd recommend peeking at the [examples folder](https://github.com/PsychoLlama/dispute/tree/master/src/examples), or (if you're feeling adventurous) [the Freighter CLI](https://github.com/PsychoLlama/freighter/blob/master/workspaces/scripts/src/scripts.js) which uses dispute under the hood.

## Roadmap
- Better documentation
- Add a function to generate an SDK from your command line app
