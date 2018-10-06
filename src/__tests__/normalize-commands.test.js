// @flow
import * as parseOption from '../parse-value';
import normalize from '../normalize-commands';

describe('Command normalizer', () => {
  it('returns a command tree with defaults', () => {
    const result = normalize({});

    expect(result).toMatchObject({
      subCommands: {},
      options: {},
      args: [],
    });
  });

  it('leaves defined fields alone', () => {
    const config = {
      command() {},
      options: {
        quiet: { usage: '-q' },
      },
      subCommands: {
        init: { command() {} },
      },
    };

    const result = normalize(config);

    expect(result.subCommands).toMatchObject(config.subCommands);
  });

  it('recursively adds defaults', () => {
    const config = {
      subCommands: {
        remote: {
          'set-url': {
            command() {},
          },
        },
      },
    };

    const result = normalize(config);

    expect(result.subCommands.remote.subCommands).toEqual({});
    expect(result.subCommands.remote.options).toEqual({});
    expect(result.subCommands.remote.args).toEqual([]);
  });

  it('adds default parsers to each command option', () => {
    const quiet = { usage: '-q' };
    const config = {
      options: { quiet },
      command() {},
    };

    const result = normalize(config);

    expect(result.options.quiet).toEqual({
      ...quiet,
      parseValue: parseOption.asString,
      optionName: 'quiet',
      usage: {
        argument: null,
        long: null,
        short: 'q',
      },
    });
  });

  // Just convenience.
  it('adds the option name to each option', () => {
    const quiet = { usage: '-q' };
    const config = normalize({
      command() {},
      options: { quiet },
    });

    expect(config.options.quiet).toMatchObject({ optionName: 'quiet' });
  });

  it('throws if configured without a command', () => {
    const args = () => normalize({ args: '[files...]' });
    const options = () => normalize({ options: {} });

    expect(args).toThrow(/arg/i);
    expect(options).toThrow(/options/i);
  });

  it('shows the full path to the invalid subcommand', () => {
    const config = {
      subCommands: {
        init: {
          subCommands: {
            cli: { args: '<dir>' },
          },
        },
      },
    };

    const fail = () => normalize(config);

    expect(fail).toThrow(/init\.subCommands\.cli/);
  });

  it('throws if an option is missing usage', () => {
    const fail = () =>
      normalize({
        command() {},
        options: {
          quiet: ({}: any),
        },
      });

    expect(fail).toThrow(/config.options.quiet/i);
  });

  it('parses option usage', () => {
    const quiet = { usage: '-v, --verbose=[bool]' };
    const config = {
      options: { quiet },
      command() {},
    };

    const result = normalize(config);

    expect(result.options.quiet.usage).toMatchObject({
      argument: { required: false, name: 'bool' },
      long: 'verbose',
      short: 'v',
    });
  });

  it('adds a link to the parent command', () => {
    const add = { command() {} };
    const remote = { subCommands: { add } };
    const config = { subCommands: { remote } };
    const result = normalize(config);

    expect(result.parent).toBe(null);
    expect(result.subCommands.remote.parent).toBe(result);
    expect(result.subCommands.remote.subCommands.add.parent).toBe(
      result.subCommands.remote
    );
  });

  it('adds the command name', () => {
    const add = { command() {} };
    const remote = { subCommands: { add } };
    const config = { subCommands: { remote } };
    const result = normalize(config);

    expect(result.name).toBe(null);
    expect(result.subCommands.remote.name).toBe('remote');
    expect(result.subCommands.remote.subCommands.add.name).toBe('add');
  });

  it('parses command arg usage', () => {
    const config = { command() {}, args: '<files...>' };
    const result = normalize(config);

    expect(result.args).toEqual([
      expect.objectContaining({
        required: true,
        variadic: true,
        name: 'files',
      }),
    ]);
  });
});
