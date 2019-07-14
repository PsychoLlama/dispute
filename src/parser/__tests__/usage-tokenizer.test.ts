// @flow
import createTokenizer from '../usage-tokenizer';
import createStream from '../input-stream';

const tokenize = (input: string) => {
  const stream = createStream(input);
  const tokenizer = createTokenizer(stream);
  const tokens = [];

  while (!tokenizer.eof()) {
    const token = tokenizer.consumeNextToken();
    tokens.push(token);
  }

  return tokens;
};

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
    const [flag] = tokenize('-q');

    expect(flag).toMatchObject({
      type: 'ShortFlag',
      name: 'q',
    });
  });

  it('calculates the right short flag line & column', () => {
    const [token] = tokenize('-s');

    expect(token.loc).toMatchObject({ line: 0, column: 0 });
  });

  it('throws if the flag name is omitted', () => {
    const fail = () => tokenize('- ');

    expect(fail).toThrow(/flag/i);
  });

  it('survives leading whitespace', () => {
    const [token] = tokenize('  -q');

    expect(token).toMatchObject({ name: 'q' });
  });

  it('allows long flags containing hyphens', () => {
    const [token] = tokenize('--no-color');

    expect(token).toMatchObject({
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
    const [token] = tokenize('-1337');

    expect(token).toMatchObject({ name: '1337' });
  });

  it('dies if more than one short name is provided', () => {
    const fail = () => tokenize('-qs');

    expect(fail).toThrow(/flag/i);
  });

  it('parses long flag names', () => {
    const [token] = tokenize('--quiet');

    expect(token).toMatchObject({
      type: 'LongFlag',
      raw: '--quiet',
      name: 'quiet',
    });
  });

  it('parses out option arguments', () => {
    const [, arg] = tokenize('--port <port-number>');

    expect(arg).toMatchObject({
      name: 'port-number',
      type: 'Argument',
      variadic: false,
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
    const [, arg] = tokenize('--color [label]');

    expect(arg).toMatchObject({
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
    const tokens = tokenize('   --from    [files]    ');

    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe('LongFlag');
    expect(tokens[1].type).toBe('Argument');
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
    const [, arg] = tokenize('-p <port>');

    expect(arg).toMatchObject({ raw: '<port>' });
  });

  it('dies on unrecognized syntax', () => {
    const tokenizer = createTokenizer(createStream('@unnatural'));
    const fail = () => tokenizer.peek();

    expect(fail).toThrow(/@/);
  });

  it('emits a punctuation token for the equals sign', () => {
    const [flag, punc, arg] = tokenize('--port=<number>');

    expect(flag).toMatchObject({ type: 'LongFlag' });
    expect(punc).toMatchObject({ type: 'Punctuation', value: '=' });
    expect(arg).toMatchObject({ type: 'Argument' });
  });

  it('emits commas as punctuation tokens', () => {
    const [short, punc, long, arg] = tokenize('-p, --port <number>');

    expect(short).toMatchObject({ type: 'ShortFlag' });
    expect(punc).toMatchObject({ type: 'Punctuation', value: ',' });
    expect(long).toMatchObject({ type: 'LongFlag' });
    expect(arg).toMatchObject({ type: 'Argument' });
  });

  it('recognizes variadic optional arguments', () => {
    const [arg] = tokenize('[arg...]');

    expect(arg).toMatchObject({
      type: 'Argument',
      required: false,
      variadic: true,
      raw: '[arg...]',
    });
  });

  it('recognizes variadic required arguments', () => {
    const [arg] = tokenize('<arg...>');

    expect(arg).toMatchObject({
      type: 'Argument',
      required: true,
      variadic: true,
    });
  });

  it('dies if variadic syntax is invalid', () => {
    const fail = () => tokenize('<arg.>');

    expect(fail).toThrow(/\./);
  });

  it('dies if the input ends unexpectedly', () => {
    const fail = () => tokenize('<arg..');

    expect(fail).toThrow(/string ended/i);
  });

  describe('isType', () => {
    it('returns false if it does not match', () => {
      const tokenizer = createTokenizer(createStream('[arg]'));

      expect(tokenizer.isType('Punctuation')).toBe(false);
    });

    it('returns true if the token matches', () => {
      const tokenizer = createTokenizer(createStream('[arg]'));

      expect(tokenizer.isType('Argument')).toBe(true);
    });

    it('works without the `this` context', () => {
      const { isType } = createTokenizer(createStream('[arg]'));

      expect(isType('Argument')).toBe(true);
    });
  });
});
