// @flow
import validateArguments from '../argument-validator';
import normalizeConfig from '../normalize-commands';

const validate = (config, args) => {
  const commandTree = normalizeConfig({ command() {}, ...config });
  return validateArguments(commandTree, args);
};

describe('Argument validator', () => {
  it('works when no arguments are expected or given', () => {
    const pass = () => validate({}, []);

    expect(pass).not.toThrow();
  });

  it('throws when arguments were expected but omitted', () => {
    const fail = () => validate({ args: '<dir>' }, []);

    expect(fail).toThrow();
  });

  it('survives when optional arguments are omitted', () => {
    const pass = () => validate({ args: '[dir]' }, []);

    expect(pass).not.toThrow();
  });

  it('indicates what arguments were omitted', () => {
    const fail = () => validate({ args: '<remote> <url>' }, ['origin']);

    expect(fail).toThrow(/url/);
  });

  it('survives with mixed required and optional args', () => {
    const config = { args: '<branch> [tracking]' };
    const pass = () => validate(config, ['first']);
    const fail = () => validate(config, []);

    expect(pass).not.toThrow();
    expect(fail).toThrow(/branch/);
  });

  it('complains if unexpected arguments are provided', () => {
    const fail = () => validate({}, ['something']);

    expect(fail).toThrow(/arguments/i);
  });

  it('reports the command name if available', () => {
    const remote = { command() {} };
    const config = normalizeConfig({
      subCommands: { remote },
    });

    const fail = () =>
      validateArguments(config.subCommands.remote, ['something']);

    expect(fail).toThrow(/remote/);
  });

  // Different messaging when the command actually accepts arguments.
  it('dies if more arguments are given than expected', () => {
    const config = { args: '<dir> <type> [name]' };
    const fail = () =>
      validate(config, ['project/', 'cli', 'yolo', 'extra', 'args']);

    expect(fail).toThrow(/3/);
    expect(fail).toThrow(/5/);
    expect(fail).toThrow(/argument/);
  });

  it('allows infinite args for variadic required usage', () => {
    const config = { args: '<files...>' };
    const pass = () =>
      validate(config, ['project/', 'file.txt', 'secrets.env']);

    expect(pass).not.toThrow();
  });

  it('allows inifite args for variadic optional usage', () => {
    const config = { args: '[files...]' };
    const pass = () =>
      validate(config, ['project/', 'file.txt', 'secrets.env']);

    expect(pass).not.toThrow();
  });

  it('still requires 1 argument for variadic required usage', () => {
    const config = { args: '<files...>' };
    const fail = () => validate(config, []);

    expect(fail).toThrow(/required/);
  });

  it('permits no arguments for optional variadic usage', () => {
    const config = { args: '[files...]' };
    const pass = () => validate(config, []);

    expect(pass).not.toThrow(/required/);
  });
});
