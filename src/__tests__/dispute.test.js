// @flow
import { handleKnownErrors } from '../error-utils';
import { createCli } from '../dispute';

// Only mock `handleKnownErrors`.
jest.mock('../error-utils', () => {
  const module = (require: Object).requireActual('../error-utils');

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
    (handleKnownErrors: Function).mockImplementation((options, fn) => fn);
  });

  it('creates a CLI', () => {
    const cli = createCli({
      commandName,
      packageJson,
    });

    expect(cli).toMatchObject({
      runWithArgs: expect.any(Function),
    });
  });

  describe('runWithArgs()', () => {
    it('invokes commands', async () => {
      const command = jest.fn();
      const cli = createCli({ commandName, packageJson, cli: { command } });

      expect(command).not.toHaveBeenCalled();
      const { options } = await cli.runWithArgs([]);
      expect(command).toHaveBeenCalledWith(options);
    });

    it('throws if no command can be resolved', async () => {
      const cli = createCli({ commandName, packageJson });
      const promise = cli.runWithArgs([]);

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

      const result = await cli.runWithArgs([]);

      expect(result.output).toBe(output);
    });

    it('rejects if the command rejects', async () => {
      const err = 'Testing dispute(...) command rejections';
      const command = () => Promise.reject(err);
      const cli = createCli({ packageJson, commandName, cli: { command } });
      const promise = cli.runWithArgs([]);

      expect(promise).rejects.toBe(err);
    });
  });

  describe('createTestInterface', () => {
    const createTestInterface = commands => {
      const cli = createCli({ commandName, packageJson, cli: commands });
      return cli.createTestInterface();
    };

    it('returns a function', () => {
      const test = createTestInterface();

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
});
