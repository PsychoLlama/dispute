// @flow
import normalize from '../normalize-config';

describe('normalize-config', () => {
  it('returns a command tree with defaults', () => {
    const result = normalize({});

    expect(result).toMatchObject({
      subCommands: {},
      options: {},
      args: null,
    });
  });

  it('leaves defined fields alone', () => {
    const config = {
      args: '<directory>',
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
    expect(result.args).toBe(config.args);
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
    expect(result.subCommands.remote.args).toBe(null);
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
      usage: {
        argument: null,
        long: null,
        short: 'q',
      },
      parseValue: expect.any(Function),
    });
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
});
