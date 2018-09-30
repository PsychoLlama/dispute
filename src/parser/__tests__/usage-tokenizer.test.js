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
    const mockError = new Error('Generated error');
    jest.spyOn(stream, 'generateError').mockReturnValue(mockError);

    const message = 'Testing `.generateError(...)`';
    const loc = { line: 0, column: 0 };
    const token = { loc, raw: '-q', message };
    const error = tokenizer.reportToken(token, message);

    expect(error).toBe(mockError);
    expect(stream.generateError).toHaveBeenCalledWith({
      ...token,
      length: token.raw.length,
    });
  });

  it('throws when attempting to read past the limit', () => {
    const tokenizer = createTokenizer(createStream('-p'));
    tokenizer.consumeNextToken();

    expect(tokenizer.eof()).toBe(true);
    const fail = () => tokenizer.consumeNextToken();
    expect(fail).toThrow(/end/i);
  });

  it('survives if the input unexpectedly ends', () => {
    const tokenizer = createTokenizer(createStream('-'));
    const fail = () => tokenizer.consumeNextToken();

    expect(fail).toThrow(/end/i);
  });

  it('complains if the delimiters are mismatched', () => {
    const tokenizer = createTokenizer(createStream('<arg]'));
    const fail = () => tokenizer.consumeNextToken();

    expect(fail).toThrow(/\]/i);
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

  it('allows long flags containing hyphens', () => {
    const tokenizer = createTokenizer(createStream('--no-color'));

    expect(tokenizer.peek()).toMatchObject({
      raw: '--no-color',
      name: 'no-color',
    });
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

  it('parses out option arguments', () => {
    const tokenizer = createTokenizer(createStream('--port <port-number>'));
    tokenizer.consumeNextToken();

    expect(tokenizer.peek()).toMatchObject({
      name: 'port-number',
      type: 'Argument',
    });
  });

  it('indicates if the argument is required', () => {
    const required = createTokenizer(createStream('--port <number>'));
    const optional = createTokenizer(createStream('--port [number]'));
    required.consumeNextToken();
    optional.consumeNextToken();

    expect(required.peek()).toMatchObject({ required: true });
    expect(optional.peek()).toMatchObject({ required: false });
  });

  it('includes the argument line & column', () => {
    const tokenizer = createTokenizer(createStream('--color [label]'));
    tokenizer.consumeNextToken();

    expect(tokenizer.peek()).toMatchObject({
      loc: {
        column: 8,
        line: 0,
      },
    });
  });

  it('throws if the trailing argument syntax is omitted', () => {
    const tokenizer = createTokenizer(createStream('--from <files'));
    tokenizer.consumeNextToken();

    const fail = () => tokenizer.peek();
    expect(fail).toThrow(/expected/i);
  });

  it('works with wonky whitespace', () => {
    const input = '   --from    [files]    ';
    const tokenizer = createTokenizer(createStream(input));
    expect(tokenizer.consumeNextToken().type).toBe('LongFlag');
    expect(tokenizer.consumeNextToken().type).toBe('Argument');
    expect(tokenizer.eof()).toBe(true);
  });

  // Includes `.peek(...)`.
  it('only reports eof if all tokens have been exhausted', () => {
    const tokenizer = createTokenizer(createStream('-p'));

    tokenizer.peek();
    expect(tokenizer.eof()).toBe(false);
    tokenizer.consumeNextToken();
    expect(tokenizer.eof()).toBe(true);
  });

  it('contains the raw argument string', () => {
    const tokenizer = createTokenizer(createStream('-p <port>'));
    tokenizer.consumeNextToken();

    expect(tokenizer.peek()).toMatchObject({
      raw: '<port>',
    });
  });

  it('dies on unrecognized syntax', () => {
    const tokenizer = createTokenizer(createStream('@unnatural'));
    const fail = () => tokenizer.peek();

    expect(fail).toThrow(/@/);
  });

  it('emits a punctuation token for the equals sign', () => {
    const tokenizer = createTokenizer(createStream('-p=<number>'));

    expect(tokenizer.consumeNextToken()).toMatchObject({ type: 'ShortFlag' });
    expect(tokenizer.consumeNextToken()).toMatchObject({
      type: 'Punctuation',
      value: '=',
    });

    expect(tokenizer.consumeNextToken()).toMatchObject({ type: 'Argument' });
  });

  it('emits commas as punctuation tokens', () => {
    const tokenizer = createTokenizer(createStream('-p, --port <number>'));

    expect(tokenizer.consumeNextToken()).toMatchObject({ type: 'ShortFlag' });
    expect(tokenizer.consumeNextToken()).toMatchObject({
      type: 'Punctuation',
      value: ',',
    });

    expect(tokenizer.consumeNextToken()).toMatchObject({ type: 'LongFlag' });
    expect(tokenizer.consumeNextToken()).toMatchObject({ type: 'Argument' });
  });
});
