// @flow
import normalizeArgv from '../normalize-argv';

describe('normalizeArgv(...)', () => {
  it('expands flag shorthands', () => {
    const result = normalizeArgv(['-qcp']);

    expect(result).toEqual(['-q', '-c', '-p']);
  });

  it('ignores arguments', () => {
    const argv = ['something-boring', './another', '**/symbols/*.{vim}'];

    expect(normalizeArgv(argv)).toEqual(argv);
  });

  it('ignores numerical switches', () => {
    const result = normalizeArgv(['-1337']);

    expect(result).toEqual(['-1337']);
  });

  it('leaves normal flags unchanged', () => {
    const alreadyNormalized = ['-s', '--port', '8080'];
    const result = normalizeArgv(alreadyNormalized);

    expect(result).toEqual(alreadyNormalized);
  });

  it('splits flag-value pairs', () => {
    const result = normalizeArgv(['--port=8080']);

    expect(result).toEqual(['--port', '8080']);
  });

  it('strips "=" signs in flag argument assigment', () => {
    const result = normalizeArgv(['--chars=+,-,=']);

    expect(result).toEqual(['--chars', '+,-,=']);
  });

  // Short flags with "=" signs aren't supported.
  it('splits conjoined pairs in short flag groups', () => {
    const result = normalizeArgv(['-vl=1']);

    expect(result).toEqual(['-v', '-l', '-=', '-1']);
  });

  it('survives if weird things happen', () => {
    const argv = ['--file=./Weird Dir/=/--content', 'stuff'];
    const result = normalizeArgv(argv);

    expect(result).toEqual(['--file', './Weird Dir/=/--content', 'stuff']);
  });
});
