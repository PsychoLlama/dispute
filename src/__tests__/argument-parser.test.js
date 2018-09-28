// @flow
import parse from '../argument-parser';

describe('argument-parser', () => {
  it('returns an object', () => {
    const result = parse({}, []);

    expect(result).toEqual(expect.any(Object));
  });

  it('pulls the root command if no command is given', () => {
    const root = {};
    const result = parse(root, []);

    expect(result.command).toBe(root);
  });

  it('extracts nested commands', () => {
    const setUrl = { command: () => {} };
    const remote = { subCommands: { 'set-url': setUrl } };
    const root = { subCommands: { remote } };
    const result = parse(root, ['remote', 'set-url']);

    expect(result.command).toBe(setUrl);
  });

  it('parses arguments for root commands', () => {
    const root = { arguments: '[commands...]' };
    const args = ['eslint', '--fix'];
    const result = parse(root, args);

    expect(result.args).toEqual(args);
  });

  it('parses arguments for nested commands', () => {
    const branch = { arguments: '[new-branch]' };
    const root = { subCommands: { branch } };
    const args = ['branch', 'new-branch'];
    const result = parse(root, args);

    expect(result.args).toEqual(args.slice(1));
  });
});
