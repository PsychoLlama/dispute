// @flow
import { handleKnownErrors } from '../parse-error-utils';
import { createCli } from '../dispute';

jest.mock('../parse-error-utils');

describe('Dispute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (handleKnownErrors: Function).mockImplementation((options, fn) => fn);
  });

  it('creates a CLI', () => {
    const cli = createCli({
      command() {},
    });

    expect(cli).toMatchObject({
      runWithArgs: expect.any(Function),
    });
  });

  describe('runWithArgs()', () => {
    it('invokes commands ', () => {
      const command = jest.fn();
      const cli = createCli({ command });

      expect(command).not.toHaveBeenCalled();
      const { options } = cli.runWithArgs([]);
      expect(command).toHaveBeenCalledWith(options);
    });

    it('throws if no command can be resolved', () => {
      const cli = createCli({});
      const fail = () => cli.runWithArgs([]);

      expect(fail).toThrow();
    });

    it('includes the promisified command output', async () => {
      const output = 'command return value';
      const cli = createCli({ command: () => output });
      const result = cli.runWithArgs([]);

      await expect(result.output).resolves.toBe(output);
    });
  });
});
