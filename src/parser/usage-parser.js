// @flow
import createStream from './input-stream';
import createTokenizer, {
  type Token,
  type Argument,
  type LongFlag,
  type ShortFlag,
  type Punctuation,
} from './usage-tokenizer';

type Usage = {
  short: ?string,
  long: ?string,
  argument: ?{
    required: boolean,
    name: string,
  },
};

export default function parseUsage(usageString: string): Usage {
  const tokenizer = createTokenizer(createStream(usageString));
  const usage: Usage = {
    argument: null,
    short: null,
    long: null,
  };

  const isFlag = () => isShortFlag() || isLongFlag();
  const expectCommaBetweenFlags = () => {
    if (tokenizer.eof() || !isFlag()) return null;
    if (!usage.long && !usage.short) return null;

    const token = tokenizer.peek();
    throw tokenizer.reportToken(
      token,
      `Expected a comma before "${token.raw}".`
    );
  };

  const expectNextIsOneOfType = (types: string[], prev: Token) => {
    if (tokenizer.eof()) {
      throw tokenizer.reportToken(
        prev,
        `Expected something after "${prev.raw}" but the string ended.`
      );
    }

    const nextTokenSatisfiesExpectations = types.some(isType);
    if (!nextTokenSatisfiesExpectations) {
      const nextToken = tokenizer.peek();
      const message =
        `Expected {${types.join(', ')}}.\n` +
        `This ain't that (it's "${nextToken.type}").`;

      throw tokenizer.reportToken(nextToken, message);
    }
  };

  const assertUnique = (
    token: Token,
    isDuplicate: boolean,
    typeName: string
  ) => {
    if (!isDuplicate) return null;

    throw tokenizer.reportToken(
      token,
      `Each option is only allowed on ${typeName}.`
    );
  };

  // Safer form of `.peek(...)`.
  const isType = (type: string) => {
    if (tokenizer.eof()) return false;
    const token = tokenizer.peek();

    return token.type === type;
  };

  // -q
  // -7331
  const isShortFlag = () => isType('ShortFlag');
  const readShortFlag = () => {
    const flag: ShortFlag = (tokenizer.consumeNextToken(): any);
    assertUnique(flag, !!usage.short, 'short flag');
    usage.short = flag.name;
    expectCommaBetweenFlags();
  };

  // --color
  // --separated-value
  const isLongFlag = () => isType('LongFlag');
  const readLongFlag = () => {
    const flag: LongFlag = (tokenizer.consumeNextToken(): any);
    assertUnique(flag, !!usage.long, 'long flag');
    usage.long = flag.name;
    expectCommaBetweenFlags();
  };

  // -c, --color
  // -c=[arg]
  const isPunctuation = () => isType('Punctuation');
  const readPunctuation = () => {
    const punc: Punctuation = (tokenizer.consumeNextToken(): any);

    switch (punc.value) {
      case ',':
        return expectNextIsOneOfType(['ShortFlag', 'LongFlag'], punc);
      case '=':
        return expectNextIsOneOfType(['Argument'], punc);
    }
  };

  // <required-arg>
  // [optional-arg]
  const isArgument = () => isType('Argument');
  const readArgument = () => {
    const arg: Argument = (tokenizer.consumeNextToken(): any);
    assertUnique(arg, !!usage.argument, 'argument');
    usage.argument = {
      required: arg.required,
      name: arg.name,
    };
  };

  const readNextToken = () => {
    if (isShortFlag()) return readShortFlag();
    if (isLongFlag()) return readLongFlag();
    if (isPunctuation()) return readPunctuation();
    if (isArgument()) return readArgument();

    throw new Error(
      `Haha, so, funny story, a token walks into a bar but it isn't a bar it's actually a usage parser that has no idea how to serve the token so it's kinda freaking out. Would you kindly post an issue? (token: ${JSON.stringify(
        tokenizer.peek()
      )})`
    );
  };

  while (!tokenizer.eof()) {
    readNextToken();
  }

  return usage;
}
