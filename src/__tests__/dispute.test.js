// @flow
import { handleKnownErrors } from '../error-utils';
import { createCli } from '../dispute';

jest.mock('../error-utils');

describe('Dispute', () => {
  const commandName = 'unit-test';
  const pkg = { version: '4.5.6' };

  beforeEach(() => {
    jest.clearAllMocks();
    (handleKnownErrors: Function).mockImplementation((options, fn) => fn);
  });

  it('creates a CLI', () => {
    const cli = createCli({
      commandName,
      pkg,
    });

    expect(cli).toMatchObject({
      runWithArgs: expect.any(Function),
    });
  });

  describe('runWithArgs()', () => {
    it('invokes commands', async () => {
      const command = jest.fn();
      const cli = createCli({ commandName, pkg, cli: { command } });

      expect(command).not.toHaveBeenCalled();
      const { options } = await cli.runWithArgs([]);
      expect(command).toHaveBeenCalledWith(options);
    });

    it('throws if no command can be resolved', async () => {
      const cli = createCli({ commandName, pkg });
      const promise = cli.runWithArgs([]);

      await expect(promise).rejects.toEqual(expect.anything());
    });

    it('resolves with the command output', async () => {
      const output = 'command return value';
      const commands = { command: () => output };
      const cli = createCli({
        cli: commands,
        commandName,
        pkg,
      });

      const result = await cli.runWithArgs([]);

      expect(result.output).toBe(output);
    });

    it('rejects if the command rejects', async () => {
      const err = 'Testing dispute(...) command rejections';
      const command = () => Promise.reject(err);
      const cli = createCli({ pkg, commandName, cli: { command } });
      const promise = cli.runWithArgs([]);

      expect(promise).rejects.toBe(err);
    });
  });
});
