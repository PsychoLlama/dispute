// @flow
import { handleKnownErrors } from '../error-utils';
import { createCli } from '../dispute';

// Only mock `handleKnownErrors`.
jest.mock('../error-utils', () => {
  const module = require.requireActual('../error-utils');

  return {
    ...module,
    handleKnownErrors: jest.fn(),
  };
});

describe('Dispute', () => {
  const commandName = 'unit-test';
  const packageJson = { version: '4.5.6' };

  beforeEach(() => {
    jest.clearAllMocks();
    (handleKnownErrors as any).mockImplementation((options, fn) => fn);
  });

  it('creates a CLI', () => {
    const cli = createCli({
      commandName,
      packageJson,
    });

    expect(cli).toMatchObject({
      execute: expect.any(Function),
    });
  });

  describe('execute()', () => {
    it('invokes commands', async () => {
      const command = jest.fn();
      const cli = createCli({ commandName, packageJson, cli: { command } });

      expect(command).not.toHaveBeenCalled();
      const { options } = await cli.execute([]);
      expect(command).toHaveBeenCalledWith(options);
    });

    it('throws if no command can be resolved', async () => {
      const cli = createCli({ commandName, packageJson });
      const promise = cli.execute([]);

      await expect(promise).rejects.toEqual(expect.anything());
    });

    it('resolves with the command output', async () => {
      const output = 'command return value';
      const commands = { command: () => output };
      const cli = createCli({
        cli: commands,
        commandName,
        packageJson,
      });

      const result = await cli.execute([]);

      expect(result.output).toBe(output);
    });

    it('rejects if the command rejects', async () => {
      const err = 'Testing dispute(...) command rejections';
      const command = () => Promise.reject(err);
      const cli = createCli({ packageJson, commandName, cli: { command } });
      const promise = cli.execute([]);

      expect(promise).rejects.toBe(err);
    });

    // There's noooo way this could bite me.
    it('uses the process argv by default', async () => {
      process.argv = process.argv.slice(0, 2).concat(['remote', 'arg']);

      const remote = { command: jest.fn(), args: '<arg>' };
      const commands = { subCommands: { remote } };
      const config = { packageJson, commandName, cli: commands };
      await createCli(config).execute();

      expect(remote.command).toHaveBeenCalledWith({}, 'arg');
    });

    it('prints the version if the global option is given', async () => {
      const root = { packageJson, commandName };
      const version = () => createCli(root).execute(['--version']);

      await expect(version()).rejects.toMatchObject({
        message: expect.stringContaining(packageJson.version),
        exitCode: 0,
      });
    });

    it('runs the command with no `this` context', async () => {
      const commands = {
        command: jest.fn(function() {
          expect(this).toBeUndefined();
        }),
      };

      const root = { packageJson, commandName, cli: commands };
      await createCli(root).execute([]);

      expect(commands.command).toHaveBeenCalled();
    });
  });

  describe('createTestInterface', () => {
    const createTestInterface = commands => {
      const cli = createCli({ commandName, packageJson, cli: commands });
      return cli.createTestInterface();
    };

    it('returns a function', () => {
      const test = createTestInterface({});

      expect(test).toEqual(expect.any(Function));
    });

    it('resolves with command output', async () => {
      const output = 'Async output';
      const test = createTestInterface({
        command: () => Promise.resolve(output),
      });

      await expect(test()).resolves.toBe(output);
    });

    it('resolves the correct command providing options', async () => {
      const options = { verbose: { usage: '-v, --verbose' } };
      const remote = { command: jest.fn(), options };
      const test = createTestInterface({
        subCommands: { remote },
      });

      await test('remote', '-v');

      expect(remote.command).toHaveBeenCalledWith({ verbose: true });
    });
  });

  describe('createApi', () => {
    it('returns an API interface', () => {
      const add = { command() {} };
      const subCommands = { add };
      const cli = { command() {}, subCommands };
      const api = createCli({ commandName, packageJson, cli }).createApi();

      expect(api).toEqual(expect.any(Function));
      expect(api.add).toEqual(expect.any(Function));
    });
  });
});
