# Dispute
A tool for building command line interfaces.

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
Shows how `git remote` might be constructed.

```js
import { createCli, parseValue } from 'dispute'

// $ git remote add ...
const addRemote = {
  args: '<remote-name> <remote-url>',

  command(options, remoteName, remoteUrl) {
    // Implementation
  },
};

// $ git remote
const remote = {
  command({ verbose = false }) {
    // Implementation
  },

  options: {
    verbose: {
      usage: '-v, --verbose=[bool]',
      parseValue: parseValue.asBoolean,
    },
  },

  subCommands: {
    add: addRemote,
  },
};

// $ git
const cli = createCli({
  subCommands: { remote },
})

// Run!
cli.execute()
```

## Roadmap
- Generate help output from command metadata (high priority)
- Add better documentation
- Automatically generate an SDK from your command line app
