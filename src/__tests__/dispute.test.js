// @flow
import { handleKnownErrors } from '../parse-error-utils';
import { createCli } from '../dispute';

jest.mock('../parse-error-utils');

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
    it('invokes commands ', () => {
      const command = jest.fn();
      const cli = createCli({ commandName, pkg, cli: { command } });

      expect(command).not.toHaveBeenCalled();
      const { options } = cli.runWithArgs([]);
      expect(command).toHaveBeenCalledWith(options);
    });

    it('throws if no command can be resolved', () => {
      const cli = createCli({ commandName, pkg });
      const fail = () => cli.runWithArgs([]);

      expect(fail).toThrow();
    });

    it('includes the promisified command output', async () => {
      const output = 'command return value';
      const commands = { command: () => output };
      const cli = createCli({
        cli: commands,
        commandName,
        pkg,
      });

      const result = cli.runWithArgs([]);

      await expect(result.output).resolves.toBe(output);
    });
  });
});
