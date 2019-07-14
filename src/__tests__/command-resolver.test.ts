// @flow
import normalizeConfig from '../normalize-commands';
import resolveCommand from '../command-resolver';

const parse = (config: object, argv: any[]) =>
  resolveCommand(normalizeConfig({ command() {}, ...config }), argv);

describe('argument-parser', () => {
  it('returns an object', () => {
    const result = parse({}, []);

    expect(result).toEqual(expect.any(Object));
  });

  it('pulls the root command if no command is given', () => {
    const root = { command() {} };
    const result = parse(root, []);

    expect(result.command.command).toBe(root.command);
  });

  it('extracts nested commands', () => {
    const add = { command: () => {} };
    const remote = { subCommands: { add } };
    const root = { subCommands: { remote } };
    const result = parse(root, ['remote', 'add']);

    expect(result.command).toMatchObject(add);
  });

  it('parses arguments for root commands', () => {
    const root = { args: '[commands...]', command() {} };
    const args = ['eslint', '--fix'];
    const result = parse(root, args);

    expect(result.args).toEqual(args);
  });

  it('parses arguments for nested commands', () => {
    const branch = { args: '[new-branch]', command() {} };
    const root = { subCommands: { branch } };
    const args = ['branch', 'new-branch'];
    const result = parse(root, args);

    expect(result.args).toEqual(args.slice(1));
  });

  // This is a tricky one. You don't know if the option
  // accepts an argument until you know the option, and
  // you don't know the option until you find the command.
  // It's a bit of a chicken and egg, and not all CLI
  // frameworks agree on how to solve it. This is my vote.
  it('ignores flags', () => {
    const save = { command() {}, options: {} };
    const stash = { subCommands: { save } };
    const root = { subCommands: { stash } };
    const result = parse(root, ['stash', '--patch', '--all', 'save']);

    expect(result.command.command).toBe(save.command);
  });

  it('moves all flags past the command', () => {
    const flags = ['--all', '--patch', '-q'];
    const stash = { command() {} };
    const root = { subCommands: { stash } };
    const result = parse(root, [...flags, 'stash', 'argument']);

    expect(result.command.command).toBe(stash.command);
    expect(result.args).toEqual([...flags, 'argument']);
  });

  it('relocates conjoined flags', () => {
    const stash = { command() {} };
    const root = { subCommands: { stash } };
    const result = parse(root, ['-qp=8080', 'stash', 'argument']);

    expect(result.args).toEqual(['-qp=8080', 'argument']);
  });
});
