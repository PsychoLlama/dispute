// @flow
import normalizeConfig from '../normalize-config';
import resolveInvocation from '../argv-resolver';

const resolve = (config, argv: string[]) =>
  resolveInvocation(normalizeConfig(config), argv);

describe('argv resolver', () => {
  it('works without any input', () => {
    const root = { command() {} };
    const result = resolve(root, []);

    expect(result).toMatchObject({
      command: { command: root.command },
      options: {},
      args: [],
    });
  });

  it('resolves subcommand arguments & options', () => {
    const options = { silent: { usage: '-s' } };
    const add = { command() {}, options, args: '<pkgs...>' };
    const root = { subCommands: { add } };
    const result = resolve(root, ['-s', 'add', 'pkg']);

    expect(result.command.command).toBe(add.command);
    expect(result.options).toMatchObject({ silent: true });
    expect(result.args).toEqual(['pkg']);
  });

  it('throws if required command arguments are missing', () => {
    const root = { command() {}, args: '<dirs>' };
    const fail = () => resolve(root, []);

    expect(fail).toThrow(/dirs/);
  });
});
