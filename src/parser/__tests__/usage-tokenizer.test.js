// @flow
import createTokenizer from '../usage-tokenizer';
import createStream from '../input-stream';

describe('Tokenizer', () => {
  it('returns a tokenizer interface', () => {
    const tokenizer = createTokenizer(createStream('content'));

    expect(tokenizer.peek).toEqual(expect.any(Function));
    expect(tokenizer.consumeNextToken).toEqual(expect.any(Function));
    expect(tokenizer.reportToken).toEqual(expect.any(Function));
  });

  it('reports the token', () => {
    const stream = createStream('-q');
    const tokenizer = createTokenizer(stream);
    jest.spyOn(stream, 'reportError').mockReturnValue();
    const token = {
      message: 'Testing `.reportError(...)`',
      loc: { line: 0, column: 0 },
      type: 'ShortFlag',
      name: 'q',
      raw: '-q',
    };

    tokenizer.reportToken(token);

    expect(stream.reportError).toHaveBeenCalledWith({
      ...token,
      length: token.raw.length,
    });
  });

  it('parses short options', () => {
    const tokenizer = createTokenizer(createStream('-q'));
    const token = tokenizer.peek();

    expect(token).toMatchObject({
      type: 'ShortFlag',
      name: 'q',
    });
  });

  it('calculates the right short flag line & column', () => {
    const tokenizer = createTokenizer(createStream('-s'));
    const token = (tokenizer.peek(): any);

    expect(token.loc).toMatchObject({ line: 0, column: 0 });
  });

  it('throws if the flag name is omitted', () => {
    const tokenizer = createTokenizer(createStream('- '));
    const fail = () => tokenizer.peek();

    expect(fail).toThrow(/flag/i);
  });

  it('survives leading whitespace', () => {
    const tokenizer = createTokenizer(createStream('  -q'));
    const token = tokenizer.peek();

    expect(token).toMatchObject({ name: 'q' });
  });

  it('stays in the same spot while peeking at the next token', () => {
    const tokenizer = createTokenizer(createStream('-q'));

    expect(tokenizer.peek()).toBe(tokenizer.peek());
  });

  it('returns the peeked token on the next consumption', () => {
    const tokenizer = createTokenizer(createStream('-q'));

    expect(tokenizer.peek()).toBe(tokenizer.consumeNextToken());
  });

  it('allows numbers as variable length short flags', () => {
    const tokenizer = createTokenizer(createStream('-1337'));
    const token = tokenizer.peek();

    expect(token).toMatchObject({ name: '1337' });
  });

  it('dies if more than one short name is provided', () => {
    const tokenizer = createTokenizer(createStream('-qs'));
    const fail = () => tokenizer.peek();

    expect(fail).toThrow(/flag/i);
  });

  it('parses long flag names', () => {
    const tokenizer = createTokenizer(createStream('--quiet'));

    expect(tokenizer.peek()).toMatchObject({
      type: 'LongFlag',
      raw: '--quiet',
      name: 'quiet',
    });
  });
});
