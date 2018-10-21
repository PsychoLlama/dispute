<div align="center">
  <img alt="dispute logo" src="https://cdn.jsdelivr.net/gh/PsychoLlama/dispute@744662288c29426397a73396c441a158f09150d4/static/logo.png" width="150" align="center" />
  <h1>Dispute</h1>
  <p>A tool for building command line interfaces.</p>

  <div>
    <a href="https://travis-ci.org/PsychoLlama/dispute"><img alt="Travis CI master build status" src="https://img.shields.io/travis/PsychoLlama/dispute/master.svg?style=popout-square" /></a>
    <a href="https://www.npmjs.com/package/dispute"><img alt="npm package version" src="https://img.shields.io/npm/v/dispute.svg?style=popout-square" /></a>
    <img alt="npm type definitions" src="https://img.shields.io/npm/types/dispute.svg?style=popout-square" />
  </div>
</div>

## Purpose
Dispute is a modern alternative to
[commander](https://www.npmjs.com/package/commander) and
[yargs](https://www.npmjs.com/package/yargs). While it supports all the usual
CLI features (subcommands, validation, help page generation, etc), dispute
focuses on two main qualities:

- **Reusability**: commands are just functions, and can be used outside the framework.
- **Testability**: dispute exposes an interface that makes testing a breeze (both unit & integration style).

## Example
Say you're building a command-line interface that reads and validates a config
file. Here's how it might look with dispute:

```js
#!/usr/bin/env node
import { createCli, ExitCode } from 'dispute'
import pkg from '../package.json'
import fs from 'fs-extra'

const cli = createCli({
  commandName: 'validate-config',
  packageJson: pkg,
  cli: {
    args: '[config-file]',
    async command(options, configFile = '.config.json') {
      const contents = await fs.readFile(configFile, 'utf8')
      const validationWarnings = validateFile(contents)

      if (!validationWarnings) {
        console.log("Hooray, it's valid!")
        return
      }

      console.log('Sorry, that looks invalid :(')
      console.log(validationWarnings)
      throw new ExitCode(1)
    },
  },
})

cli.execute()
```

`cli.execute()` is what actually runs your CLI. It parses, validates, & runs
the command using `process.argv`.

For more examples, browse [the `examples/`
folder](https://github.com/PsychoLlama/dispute/tree/master/src/examples).

## API
### Table of Contents
- [`createCli(...)`](#createcli)
- [`.execute(...)`](#createcliexecute)
- [`.createTestInterface(...)`](#createclicreatetestinterface)
- [`ExitCode(...)`](#exitcode)

### `createCli(...)`
Validates the given config and returns a few different ways to interact with
the CLI. Most of this section is about the config format and how to structure
your commands.

The config consists of two parts: metadata and commands. The metadata is made
up of your package.json file and the name of your command (i.e. how your users
will call it). Those are the only required fields.

```js
// This is the simplest possible config.
createCli({
  commandName: 'eslint',
  packageJson: require('../package.json'),
})
```

> **Note:** `package.json` is used to print the version number. Other fields
> like `homepage` or `bugs.url` might be used in the future.

Next, you tell dispute what commands are supported using `config.cli`. Every
command has the same format:

```js
{
  // This is what gets called.
  command: undefined || Function,

  // What flags does the command support? e.g. '--port=3000' or '--color'
  options: undefined || Object,

  // What arguments does the command accept?
  args: undefined || string,

  // An optional command description printed with the --help flag.
  description: undefined || string,

  // Any nested commands... more on this later.
  subCommands: undefined || Object,
}
```

Most of these are optional. The only exception is `command` and `subCommands`.
You can specify either or both, but at least one must be provided. Let's look
at `.command` first.

Commands take an options object (defined by `.options`) followed by any number
of arguments (defined by `.args`). If no options are defined, `options` will
always be an empty object.

```js
{
  command(options, ...args) {
    // options: {}
    // args: []
  }
}
```

Options are a mapping between option names and how they should be parsed.
Here's the high-level structure:

```js
{
  // How should the user pass these options?
  usage: string,

  // If the option accepts an argument, how should it be parsed?
  // By default arguments are interpreted as plain strings.
  parseValue: undefined || Function

  // Optionally show this description in the --help page.
  description: undefined || string,
}
```

`usage` defines how the flags are named and whether an argument is allowed. It
looks something like this:

```js
{
  usage: '-p, --port <number>',
}
```

In the example above, if the user wants to pass the port `3000` as an option,
they could use `-p 3000` or `--port 3000`. The `<...>` delimiters mean an
argument is required. If the number should be optional, use `--port [number]`
instead. This is a pattern used throughout dispute, as well as most CLI
frameworks.

Now bringing it back to `.command`, here's how options fit in:
```js
cli: {
  options: {
    portNumber: { usage: '--port <number>' },
  },

  command({ portNumber = 3000 }) {
    const server = new http.Server()
    server.listen(portNumber);
  },
}

// `portNumber` is set via `--port`:
// $ cmd --port 8080
```

> **Note:** there's no way to specify an option's default value. [Use ES2015
> default
> assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
> instead (as shown in the example).

Options support two other fields: a `description` which is shown in the help
page, and `parseValue`, which is used to parse the option's argument from a
string into something else.

You can implement `parseValue(...)` however you like, but you probably won't
need to. Dispute ships with several parsers supporting validation out of the
box.

```js
import { parseValue } from 'dispute'

{
  options: {
    // Valid: --port 8080, --port 3000
    // Throws: --port string, --port Infinity
    port: {
      usage: '--port <number>',
      parseValue: parseValue.asNumber,
    },

    // --color=yes, --color=on, --color=true
    useColor: {
      usage: '--color [enabled]',
      parseValue: parseValue.asBoolean,
    },
  },
}
```

By default, the value parser is `parseValue.asString`.

Excellent. Now, moving on to `command.args`! By default, commands don't accept
any arguments, and dispute will warn the user if they try to pass any.

There are a few different types of arguments. Optional, required, and variadic.
You can mix them however you choose (so long as required arguments don't follow
optional... that wouldn't make much sense).

Dispute will map those arguments onto your `.command` function following the
options object.

```
{
  // The first argument is required, the second is optional,
  // and any number of arguments can follow.
  args: '<required> [optional] [variadic...]',
  command(options, required, optional = 'default value', ...variadic) {
    // Implementation
  },
}
```

> **Note:** there's a subtle difference between `<args...>` and `[args...]`.
> The first requires 1 or more parameters, the second requires 0 or more.

Finally, `.subCommands` tells dispute what commands are callable from beneath
this one. `git` is probably the most common example of this. Many of its
commands have other commands beneath it, like `git remote` which has `git
remote add ...` and `git remote set-url`.

`.subCommands` maps the command name to another command object.

```js
{
  options: {
    verbose: { usage: '-v, --verbose' },
  },

  command({ verbose = false }) {
    // git remote [-v|--verbose]
  },

  subCommands: {
    add: {
      args: '<remote-name> <remote-url>',
      command(options, remoteName, remoteUrl) {
        // git remote add
      },
    },

    'set-url': {
      args: '<remote-name> <remote-url>',
      command(options, remoteName, remoteUrl) {
        // git remote set-url
      },
    },
  },
}
```

A couple of things to note, in case you're worried or wondering:
- The options of each command **only** apply to that specific command.
- Dispute only runs one command. In this example, `git remote set-url` only
  calls the `set-url` command. Nothing else.
- Subcommands can contain more subcommands. Nest as deeply as you like.

And there you have it! That's everything you might want to know about dispute's
configuration. To bring it all together, here's the full format:

```js
createCli({
  commandName: string,
  packageJson: Object,
  cli: {
    options: {
      [optionName]: {
        usage: '-l, --long-flag <required-argument>',
        description: 'Shown in the help page',
        parseValue: Function,
      }
    },

    description: 'Shown in the help page',

    args: '<required> [optional] [variadic...]',

    command(options, ...args) {
      // Implementation
    },

    subCommands: {
      [commandName]: Object,
    },
  },
})
```

### `createCli(...).execute(...)`
Parses, validates, and runs the command using `process.argv.slice(2)`.
Optionally, pass a string array and it'll parse that instead.

`.execute()` returns a promise. If command failed or never ran (which happens
if the user passes `--version` or `--help`), `.execute()` will reject with the
error instance. Don't worry about catching the error though, dispute handles
that automatically.

If the command runs successfully, the resolve value will contain whatever the
command returned as the `.output` property. The resolve value has other data,
but think carefully before using any of it.

```js
cli.execute().then(result => {
  console.log('Command finished and returned:', result.output);
})
```

### `createCli(...).createTestInterface()`
Returns a CLI interface more amenable to unit & integration tests. If the
command throws an `ExitCode`, this won't kill the test process and you can
handle it just like a normal error.

The test function accepts any number of arguments and parses them like
`process.argv`. The return value is a promise that resolves with whatever the
command returns.

Not that I think docker should use dispute (or JavaScript for that matter), but
if they did, here's what the tests might look like:

```js
const docker = createCli(config)
const cli = docker.createTestInterface()

describe('docker run', () => {
  it('starts a container', async () => {
    await cli('docker', 'run', 'node:alpine')

    expect(container.start).toHaveBeenCalledWith('node:alpine')
  })

  it('fails if the container tag is invalid', async () => {
    container.findByTagName.mockResolvedValue(null)
    const fail = () => cli('docker', 'run', 'bad-container-name')

    await expect(fail).rejects.toMatchObject({ exitCode: 1 })
  })
})
```

### `ExitCode(...)`
One of the ways a command communicates failure is through the exit code. If
it's non-zero, then something horrible happened. Maybe the config file didn't
exist, a spawned process died unexpectedly, or perhaps a value was just out of
range. In many other CLIs the common approach is to call `process.exit(1)`.
That's **a terrible idea** for many reasons:
- Mocking out `process.exit` in a test environment is dangerous and tedious.
- Error handling is non-existent. You call `process.exit` and your program is
  done.
- Since failures can't be handled by the caller, reusing code becomes
  dangerous and inflexible.

That's why dispute includes `ExitCode`. JavaScript already has a way to model
unexpected failures: by throwing errors. If nothing else catches an `ExitCode`,
dispute will forward the code to `process.exit` and terminate the process.

```js
import { ExitCode, createCli } from 'dispute'

createCli({
  // ...config
  cli: {
    command() {
      console.error('Something went wrong')
      throw new ExitCode(1)
    },
  },
})
```

> **Note:** if your command runs asynchronously, return a promise. Rejecting
> with an `ExitCode` will have the same effect.

## Naming
I chose the name "dispute" because it's a command-line **argument** parser and
I wanted a clever synonym. Plus, it's an unspoken rule that every good npm
package has to be 2 syllables.

## Projects Using Dispute
- [@freighter/scripts](https://www.npmjs.com/package/@freighter/scripts)
- [@freighter/cli](https://www.npmjs.com/package/@freighter/cli)

If you're using dispute in a public project, submit a pull request!
