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

  it('splits short conjoined pairs', () => {
    const result = normalizeArgv(['-v=./:/etc/var/app']);

    expect(result).toEqual(['-v', './:/etc/var/app']);
  });

  it('ignores "=" signs in the argument', () => {
    const result = normalizeArgv(['--chars=+,-,=']);

    expect(result).toEqual(['--chars', '+,-,=']);
  });

  it('splits conjoined pairs in short flag groups', () => {
    const result = normalizeArgv(['-vp=8080']);

    expect(result).toEqual(['-v', '-p', '8080']);
  });

  it('survives if weird things happen', () => {
    const argv = ['-zxv=./Weird Dir/=/--content', 'stuff'];
    const result = normalizeArgv(argv);

    expect(result).toEqual([
      '-z',
      '-x',
      '-v',
      './Weird Dir/=/--content',
      'stuff',
    ]);
  });
});
